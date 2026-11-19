import axios from 'axios';
const api=axios.create({baseURL:'/api',timeout:18000});
api.interceptors.request.use(config=>{const token=sessionStorage.getItem('nexa_token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(v=>v,err=>{if(err.response?.status===401&&!err.config?.url?.includes('/auth/login')){sessionStorage.removeItem('nexa_token');sessionStorage.removeItem('nexa_user');if(location.pathname!=='/login')location.replace('/login');}return Promise.reject(err);});
export const errorMessage=err=>err?.response?.data?.erro||err?.message||'Ocorreu um erro. Tente novamente.';
export default api;
