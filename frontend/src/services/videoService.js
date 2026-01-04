import api from './api';

/**
 * Upload video with progress tracking
 */
export const uploadVideo = async (file, metadata, onProgress) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', metadata.title);

    if (metadata.description) formData.append('description', metadata.description);

    // Check if tags is an array or string
    if (metadata.tags) {
        let tagsValue = metadata.tags;
        if (Array.isArray(tagsValue)) {
            tagsValue = tagsValue.join(',');
        }
        formData.append('tags', tagsValue);
    }

    try {
        const response = await api.post('/videos/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onProgress) {
                    onProgress(percentCompleted);
                }
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Upload failed' };
    }
};

/**
 * Get all videos
 */
export const getVideos = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.tags) params.append('tags', filters.tags);
        if (filters.status) params.append('status', filters.status);

        const response = await api.get(`/videos?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch videos' };
    }
};

/**
 * Get current user's videos
 */
export const getMyVideos = async () => {
    try {
        const response = await api.get('/videos/my-videos');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch your videos' };
    }
};

/**
 * Get single video by ID
 */
export const getVideoById = async (id) => {
    try {
        const response = await api.get(`/videos/${id}`);
        // Handle both formats: { success: true, video: {...} } or directly {...}
        // Normalizing here ensures the component receives the object it expects
        return response.data.video || response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch video' };
    }
};

/**
 * Update video metadata
 */
export const updateVideo = async (id, metadata) => {
    try {
        const response = await api.put(`/videos/${id}`, metadata);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update video' };
    }
};

/**
 * Delete video
 */
export const deleteVideo = async (id) => {
    try {
        const response = await api.delete(`/videos/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete video' };
    }
};