import React,{createContext,useContext,useState,useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [token,setToken]=useState(()=>sessionStorage.getItem('nexa_token'));
 const [user,setUser]=useState(()=>{try{return JSON.parse(sessionStorage.getItem('nexa_user'));}catch{return null;}});
 const [checking,setChecking]=useState(!!token);
 useEffect(()=>{let alive=true;if(!token){setChecking(false);return;}api.get('/auth/me').then(({data})=>{if(alive){setUser(data);sessionStorage.setItem('nexa_user',JSON.stringify(data));}}).catch(()=>{if(alive){sessionStorage.removeItem('nexa_token');sessionStorage.removeItem('nexa_user');setToken(null);setUser(null);}}).finally(()=>alive&&setChecking(false));return()=>{alive=false;};},[token]);
 const login=async(email,senha)=>{const {data}=await api.post('/auth/login',{email,senha});sessionStorage.setItem('nexa_token',data.token);sessionStorage.setItem('nexa_user',JSON.stringify(data.usuario));setUser(data.usuario);setToken(data.token);return data;};
 const logout=()=>{sessionStorage.removeItem('nexa_token');sessionStorage.removeItem('nexa_user');setToken(null);setUser(null);};
 return <AuthContext.Provider value={{user,token,checking,login,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
