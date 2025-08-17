import { useState, useCallback } from 'react';
import { createCourse as createCourseApi, updateCourse as updateCourseApi } from '@/api/educator'; // Import updateCourseApi
import { toast } from 'react-toastify'; 

export const useCreateCourse = () => {
  const [isCreating, setIsLoading] = useState(false); // Renamed from isCreating for clarity
  const [error, setError] = useState(null);

  // This function now handles both creation and update operations
  const submitCourse = useCallback(async (formData, courseId = null) => {
    setIsLoading(true); // Set loading state to true
    setError(null); // Clear previous errors

    try {
      let response;
      if (courseId) {
        // If a courseId is provided, call the update API
        response = await updateCourseApi(courseId, formData);
        toast.success('Course updated successfully!');
      } else {
        // Otherwise, call the create API
        response = await createCourseApi(formData);
        toast.success('Course created successfully and submitted for review!');
      }
      return response; // Return the created or updated course data
    } catch (err) {
      console.error("Error in useCreateCourse hook (submitCourse):", err);
      const errorMessage = err?.response?.data?.message || 'Failed to save course. Please try again.';
      toast.error(errorMessage);
      setError(err); 
      return null; 
    } finally {
      setIsLoading(false); // Set loading state back to false
    }
  }, []);

  // Renamed return values for clarity: isCreating is now isLoading for any submission
  return { submitCourse, isCreating, error }; 
};
