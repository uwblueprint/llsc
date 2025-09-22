import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreateRequest, UserRole, SignUpMethod


class TestUserCreateRequestPasswordValidation:
    """Test password validation in UserCreateRequest schema"""

    def test_password_validation_success_valid_password(self):
        """Test that a valid password passes validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User", 
            "email": "test@example.com",
            "password": "ValidPass123!",
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        # Should not raise any exception
        user_request = UserCreateRequest(**user_data)
        assert user_request.password == "ValidPass123!"

    def test_password_validation_too_short(self):
        """Test that password less than 8 characters fails validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com", 
            "password": "short1!",  # Only 7 characters
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**user_data)
        
        # Check that the error message contains the expected validation message
        error_msg = str(exc_info.value)
        assert "be at least 8 characters long" in error_msg

    def test_password_validation_missing_uppercase(self):
        """Test that password without uppercase letter fails validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "lowercase123!",  # No uppercase
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**user_data)
        
        error_msg = str(exc_info.value)
        assert "contain at least one uppercase letter" in error_msg

    def test_password_validation_missing_lowercase(self):
        """Test that password without lowercase letter fails validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "UPPERCASE123!",  # No lowercase
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**user_data)
        
        error_msg = str(exc_info.value)
        assert "contain at least one lowercase letter" in error_msg

    def test_password_validation_missing_special_character(self):
        """Test that password without special character fails validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "NoSpecial123",  # No special characters
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**user_data)
        
        error_msg = str(exc_info.value)
        assert "contain at least one special character" in error_msg

    def test_password_validation_multiple_errors(self):
        """Test that password with multiple issues returns all errors"""
        user_data = {
            "first_name": "Test", 
            "last_name": "User",
            "email": "test@example.com",
            "password": "short",  # Too short, no uppercase, no special char
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        with pytest.raises(ValidationError) as exc_info:
            UserCreateRequest(**user_data)
        
        error_msg = str(exc_info.value)
        # Should contain multiple validation errors
        assert "be at least 8 characters long" in error_msg
        assert "contain at least one uppercase letter" in error_msg
        assert "contain at least one special character" in error_msg

    def test_password_validation_google_signup_no_password_required(self):
        """Test that Google signup doesn't require password validation"""
        user_data = {
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            # No password provided
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.GOOGLE,
        }
        
        # Should not raise any exception for Google signup
        user_request = UserCreateRequest(**user_data)
        assert user_request.password is None

    def test_password_validation_edge_cases(self):
        """Test edge cases for password validation"""
        # Test with exactly 8 characters
        user_data = {
            "first_name": "Test",
            "last_name": "User", 
            "email": "test@example.com",
            "password": "MinPass1!",  # Exactly 8 chars, meets all requirements
            "role": UserRole.PARTICIPANT,
            "signup_method": SignUpMethod.PASSWORD,
        }
        
        # Should not raise any exception
        user_request = UserCreateRequest(**user_data)
        assert user_request.password == "MinPass1!"

    def test_password_validation_all_special_characters(self):
        """Test that all allowed special characters work"""
        special_chars = ["!", "@", "#", "$", "%", "^", "&", "*"]
        
        for char in special_chars:
            user_data = {
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com", 
                "password": f"ValidPass1{char}",
                "role": UserRole.PARTICIPANT,
                "signup_method": SignUpMethod.PASSWORD,
            }
            
            # Should not raise any exception
            user_request = UserCreateRequest(**user_data)
            assert user_request.password == f"ValidPass1{char}" 