import { toast } from 'react-toastify';

/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object from the API call
 * @param {string} [defaultMessage='An error occurred'] - Default error message
 * @returns {string} - The error message to display
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  // Handle network errors
  if (!error.response) {
    toast.error('Network error. Please check your connection.');
    return 'Network error. Please check your connection.';
  }

  const { status, data } = error.response;
  let errorMessage = defaultMessage;

  // Handle different HTTP status codes
  switch (status) {
    case 400:
      errorMessage = data.message || 'Invalid request';
      break;
    case 401:
      // Handle unauthorized (will be handled by axios interceptor)
      return 'Unauthorized';
    case 403:
      errorMessage = 'You do not have permission to perform this action';
      break;
    case 404:
      errorMessage = 'The requested resource was not found';
      break;
    case 409:
      errorMessage = data.message || 'A conflict occurred';
      break;
    case 422:
      errorMessage = 'Validation error';
      // Handle validation errors
      if (data.errors) {
        const errorList = Object.values(data.errors).flat();
        errorMessage = errorList.join('\n');
      }
      break;
    case 429:
      errorMessage = 'Too many requests. Please try again later.';
      break;
    case 500:
      errorMessage = 'An internal server error occurred';
      break;
    default:
      errorMessage = data.message || defaultMessage;
  }

  // Show error toast
  if (errorMessage) {
    toast.error(errorMessage);
  }

  return errorMessage;
};

/**
 * Handles form submission errors and sets form errors
 * @param {Error} error - The error object from the API call
 * @param {Function} setErrors - The form's setErrors function
 * @param {string} [defaultMessage='An error occurred'] - Default error message
 */
export const handleFormError = (error, setErrors, defaultMessage = 'An error occurred') => {
  console.error('Form Error:', error);
  
  if (!error.response) {
    toast.error('Network error. Please check your connection.');
    return;
  }

  const { status, data } = error.response;

  // Handle validation errors
  if (status === 422 && data.errors) {
    setErrors(data.errors);
    return;
  }

  // Handle other errors
  const errorMessage = data?.message || defaultMessage;
  if (errorMessage) {
    toast.error(errorMessage);
  }
};
