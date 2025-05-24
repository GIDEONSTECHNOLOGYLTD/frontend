import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '../utils/errorHandler';

/**
 * Custom hook for handling form state, validation, and submission
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Function to call on form submission
 * @param {Object} [initialErrors={}] - Initial form errors
 * @returns {Object} - Form state and handlers
 */
const useForm = (initialValues, onSubmit, initialErrors = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  /**
   * Handle input change
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Handle different input types
    const inputValue = type === 'checkbox' 
      ? checked 
      : type === 'file' 
        ? files[0] 
        : value;

    setValues(prev => ({
      ...prev,
      [name]: inputValue
    }));

    // Clear error for the current field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  /**
   * Handle form submission
   * @param {React.FormEvent} e - The form submission event
   * @param {Object} [options] - Additional options
   * @param {Function} [options.onSuccess] - Callback on successful submission
   * @param {string} [options.successMessage] - Success message to show
   * @param {string} [options.redirectTo] - Path to redirect to on success
   */
  const handleSubmit = useCallback(async (e, { 
    onSuccess, 
    successMessage,
    redirectTo 
  } = {}) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onSubmit(values);
      
      if (successMessage) {
        // Show success message if provided
        // You'll need to implement toast or another notification system
        console.log(successMessage);
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Redirect if specified
      if (redirectTo) {
        navigate(redirectTo);
      }
      
      return result;
    } catch (error) {
      // Handle API errors
      handleApiError(error, 'An error occurred while submitting the form');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, navigate, onSubmit]);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors(initialErrors);
  }, [initialValues, initialErrors]);

  /**
   * Set a field value programmatically
   * @param {string} name - Field name
   * @param {any} value - Field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Set a field error programmatically
   * @param {string} name - Field name
   * @param {string} error - Error message
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues,
    setErrors,
    resetForm,
    setFieldValue,
    setFieldError
  };
};

export default useForm;
