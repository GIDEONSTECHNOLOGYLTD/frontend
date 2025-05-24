import { useEffect, useRef } from 'react';
import { CancelToken } from 'axios';

/**
 * Custom hook to handle cancellable API requests
 * @returns {Object} Object containing createCancelToken function
 */
export function useCancellableRequest() {
  const cancelTokenSource = useRef(null);
  const isMounted = useRef(true);

  // Cancel any pending requests when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel('Component unmounted, cancelling request');
      }
    };
  }, []);

  /**
   * Creates a new cancel token for the request
   * @returns {Object} Cancel token object
   */
  const createCancelToken = () => {
    // Cancel any existing request
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('New request started, cancelling previous');
    }

    // Create new cancel token
    cancelTokenSource.current = CancelToken.source();
    return cancelTokenSource.current.token;
  };

  return { 
    createCancelToken,
    isMounted 
  };
}
