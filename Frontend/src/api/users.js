import axios from './axios';

export const getAllUsers = () => axios.get('/users');
export const createUser = (data) => axios.post('/users', data);
export const deleteUser = (id) => axios.delete(`/users/${id}`);
