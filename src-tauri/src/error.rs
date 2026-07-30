#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_error() {
        let err = AppError::Database(rusqlite::Error::InvalidParameterName("test".into()));
        assert!(err.to_string().contains("Database error"));
    }

    #[test]
    fn test_not_found_error() {
        let err = AppError::NotFound("Product not found".into());
        assert_eq!(err.to_string(), "Not found: Product not found");
    }

    #[test]
    fn test_internal_error() {
        let err = AppError::Internal("Something broke".into());
        assert_eq!(err.to_string(), "Internal error: Something broke");
    }

    #[test]
    fn test_config_error() {
        let err = AppError::Config("Invalid config".into());
        assert_eq!(err.to_string(), "Configuration error: Invalid config");
    }

    #[test]
    fn test_serialization() {
        let err = AppError::NotFound("test".into());
        let serialized = serde_json::to_string(&err).unwrap();
        assert_eq!(serialized, "\"Not found: test\"");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let app_err: AppError = io_err.into();
        assert!(app_err.to_string().contains("IO error"));
    }
}
