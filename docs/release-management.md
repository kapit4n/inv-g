# Release Management

How an Inventory Gear release is built and published, and what to do when it fails.

- **Distribution channel:** GitHub Releases. No paid store (Microsoft Store,
  Chocolatey, winget) is involved.
- **Platform:** Windows only, via the NSIS installer.
- **Trigger:** a `v*` Git tag. Nothing else creates a release.
- **Pipeline:** `.github/workflows/windows-installer.yml`
- **Installer details:** [Windows Installer](./windows-installer.md)

---

## Architecture

```
git push origin v1.0.0
        │
        ▼
GitHub Actions — "Windows Installer", on windows-latest
        │
        ├─ verify version sync      (package.json == Cargo.toml)
        ├─ verify tag == version    (v1.0.0 == 1.0.0)
        ├─ typecheck / lint
        ├─ vitest  (all suites)
        ├─ cargo test
        ├─ tauri build --bundles nsis
        ├─ normalize name  →  InventoryGear-1.0.0-setup.exe
        ├─ upload-artifact          (run Artifacts, 30 days)
        └─ softprops/action-gh-release@v2
                │
                ▼
        GitHub Release v1.0.0  (draft, generated notes, .exe attached)
                │
                ▼
        human reviews the draft and publishes it
```

There is exactly **one** workflow that can publish, and `ci.yml` never touches
releases. Both facts are asserted by
`tests/integration/release-workflow.test.ts`.

## The trigger is a tag, and only a tag

| Event | Builds an installer? | Creates a release? |
| --- | --- | --- |
| `git push origin main` | no (`ci.yml` only) | **no** |
| `git push origin develop` | no | **no** |
| pull request | no | **no** |
| `git push origin v1.0.0` | yes | **yes** |
| `git push origin v1.0.1` | yes | **yes** |
| Actions → Run workflow (manual) | yes | **no** — build only |

A manual run is useful for checking that packaging still works without publishing
anything: the installer lands in the run's *Artifacts*. The `publish` input that
used to sit on the manual trigger was removed — see the error below.

## Version and tag convention

`package.json` is the single source of truth:

| File | Version |
| --- | --- |
| `package.json` | **authoritative** |
| `src-tauri/tauri.conf.json` | `"version": "../package.json"` — reads the above |
| `src-tauri/Cargo.toml` | must match; Cargo cannot read `package.json` |
| Git tag | `v` + the `package.json` version, checked in CI |

So a correct release is internally consistent by construction:

```
tag                v1.2.0
GitHub Release     v1.2.0
app version        1.2.0        (package.json)
installer name     InventoryGear-1.2.0-setup.exe
```

The workflow **fails** if the tag and `package.json` disagree, so a mistyped tag
cannot publish a mislabelled installer:

```
::error::Tag v9.9.9 does not match the app version 1.0.0.
Run 'npm run version:set 9.9.9' and commit before tagging.
```

```bash
npm run version:check     # fails on drift (also part of npm run verify)
npm run version:sync      # rewrite Cargo.toml from package.json
npm run version:set 1.2.0 # set package.json + Cargo.toml together
```

Bump the version **before** tagging. Nothing rewrites your files for you.

## Windows installer locations

Only NSIS is built. `bundle.targets` is `all` in `tauri.conf.json`, but the
pipeline passes `--bundles nsis`, so no `.msi` is produced.

| What | Path |
| --- | --- |
| Bundler output (raw) | `src-tauri/target/release/bundle/nsis/*.exe` |
| Normalized asset | `src-tauri/target/release/bundle/nsis/InventoryGear-<version>-setup.exe` |
| Run artifact | `InventoryGear-<version>-windows-installer` (30-day retention) |
| Release asset | the same `InventoryGear-<version>-setup.exe` |

The raw name comes from `productName` + version and changes with bundler versions;
CI renames it to the stable form above so download links do not rot. The path is
defined once, in `INSTALLER_ASSET`, and both the artifact upload and the release
read it, so they cannot drift apart.

> **The installer can only be built on Windows.** On Linux/macOS
> `tauri build --bundles nsis` exits 0 and produces *nothing* — no installer, no
> error. This is why the pipeline runs on `windows-latest`. See
> [Windows Installer](./windows-installer.md).

## Publishing a release

```bash
git checkout main
git pull

npm run version:set 1.0.1        # if this is a new version
npm run verify                   # must be green
git commit -am "release: 1.0.1"
git push origin main

git tag v1.0.1
git push origin v1.0.1
```

Then GitHub Actions builds the installer and opens a **draft** release. Drafts are
deliberate: review the notes and the asset, then press **Publish release**.

- **Patch** `1.0.0` → `1.0.1`
- **Minor** `1.0.1` → `1.1.0`
- **Major** `1.1.0` → `2.0.0`

There is no branch- or PR-based release path, by design.

## Why it failed with `Missing tag_name parameter`

```text
Run softprops/action-gh-release@v2
GitHub release failed with status: 400
{"message":"Missing tag_name parameter","status":"400"}
Unexpected error fetching GitHub release for tag refs/heads/main
```

This was **not** caused by a `main` push. The workflow was already tag-only from
the day it was added. The release step was reachable a second way:

```yaml
on:
  workflow_dispatch:
    inputs:
      publish:
        default: true          # ← on by default
...
- name: Release
  if: startsWith(github.ref, 'refs/tags/v') || inputs.publish
```

A manual run (*Actions → Run workflow*) on `main` sets `github.ref` to
`refs/heads/main` and `inputs.publish` to `true`, so `|| inputs.publish` was true
and the step ran with no tag. `softprops/action-gh-release` falls back to
`github.ref` when `tag_name` is not given, tried to treat `refs/heads/main` as a
tag, and the API answered `400`.

Three changes close it off:

1. the release step requires `github.ref_type == 'tag'`, so a manual run builds
   the installer and stops there;
2. `tag_name: ${{ github.ref_name }}` is passed explicitly, so the action never
   has to guess (`github.ref_name` is `v1.0.0`, not `refs/heads/main`);
3. the `publish` input is gone, so there is no longer a switch that can turn a
   branch run into a release.

## Re-running and duplicates

Re-running a tag run is safe. The action **updates** the release that already
exists for that tag and replaces the asset (`overwrite_files` defaults to true);
it does not create a second release. Nothing is ever deleted automatically.

```bash
# Re-run the workflow for a tag
gh run list --workflow windows-installer.yml
gh run rerun <run-id>

# Or edit/replace the asset by hand
gh release upload v1.0.1 InventoryGear-1.0.1-setup.exe --clobber
gh release edit v1.0.1 --draft=false
```

## Troubleshooting

**`Missing tag_name parameter` / `Unexpected error fetching GitHub release for tag refs/heads/...`**
The release step ran without a tag. The guard is `github.ref_type == 'tag'`; if
you added a trigger or a `publish` input, that is what to check. The regression
test fails if either comes back.

**`Tag v9.9.9 does not match the app version 1.0.0`**
The tag and `package.json` disagree. Run `npm run version:set 9.9.9`, commit, and
delete the bad tag (`git tag -d v9.9.9 && git push origin :refs/tags/v9.9.9`).

**`No NSIS bundle directory` / `No .exe found`**
The Rust build succeeded but the bundler produced nothing. Check the
*List generated installers* step, which prints everything under
`src-tauri/target/release/bundle`. On a custom runner image, WebView2 or NSIS
may be missing.

**`Windows Defender quarantined the build`**
Defender flags freshly built unsigned Rust binaries and can corrupt the NSIS
build. The workflow already excludes `src-tauri/target` and `node_modules`.

**The release exists but has no notes**
`generate_release_notes: true` fills them from the commits since the previous
release. With no comparable previous release, the section can be empty — add a
summary by hand before publishing.

**`Resource not accessible by integration`**
The workflow's `contents: write` was removed or the job was moved under a
workflow that does not grant it.

## Testing the workflow without publishing

- **Manual run** — Actions → *Windows Installer* → *Run workflow*. Builds the
  installer, uploads the artifact, creates no release. This is the safe way to
  check that packaging still works.
- **Static checks** — `npx vitest run tests/integration/release-workflow.test.ts`
  asserts the trigger, the tag guard, the permission, the token, the asset path
  and the version guard.
- **Lint the YAML** — `actionlint` (both workflows pass clean):

  ```bash
  actionlint
  ```

- **Local build (Windows only)** — `npm run tauri:build:windows`.

## Recovering from a failed release

1. Read the failing step in the run log.
2. Fix the cause and commit to `main`.
3. Re-run the tag's workflow (*Re-run all jobs*). `github.ref` is still
   `refs/tags/v1.0.1`, so the release step runs and updates the existing release.
4. If the tag itself was wrong, delete it locally and remotely, then tag again:

   ```bash
   git tag -d v1.0.1
   git push origin :refs/tags/v1.0.1
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. If a release was published with the wrong assets, replace the file rather than
   deleting the release: `gh release upload <tag> <file> --clobber`.

## Known limitations

- **Windows only.** No macOS or Linux packaging is configured.
- **No MSI.** Only NSIS is built; `.msi` would need the WiX toolchain.
- **Unsigned.** No code-signing certificate, so SmartScreen warns on first run.
  See [Windows Installer → Code signing](./windows-installer.md#code-signing).
- **Draft releases are published by hand** — nothing goes live automatically.

## Related

- [Windows Installer](./windows-installer.md) — what the installer does on a user's machine
- `src-tauri/tauri.conf.json` — bundle and NSIS configuration
- `scripts/version.mjs` — version single-source-of-truth enforcement
- `.github/workflows/windows-installer.yml` — the release pipeline
- `tests/integration/release-workflow.test.ts` — release invariants
- [Deployment](./DEPLOYMENT.md) — general deployment notes
