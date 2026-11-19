import React from 'react';
import {LoaderCircle,X,Search,Plus,ArrowUpRight,ChevronDown} from 'lucide-react';
export const currency=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0));
export const dateTime=s=>s?new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'—';
export const dateOnly=s=>s?new Date(s).toLocaleDateString('pt-BR'):'—';
export function Brand({compact=false}){return <div className="brand"><div className="brand-symbol"><span>N</span><i/></div>{!compact&&<div className="brand-text"><strong>NEXA<span>STORE</span></strong><small>RETAIL MANAGEMENT</small></div>}</div>;}
export function Button({children,variant='primary',loading=false,icon:Icon, ...props}){return <button {...props} disabled={loading||props.disabled} className={`btn btn-${variant} ${props.className||''}`}>{loading?<LoaderCircle size={16} className="spin"/>:Icon?<Icon size={16}/>:null}{children}</button>;}
export function PageHeader({eyebrow,title,description,actions}){return <div className="page-head"><div><div className="eyebrow">{eyebrow||'NEXA STORE / GESTÃO'}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="head-actions">{actions}</div>}</div>;}
export function StatCard({label,value,icon:Icon,tone='indigo',subtitle}){return <div className="stat-card"><div className="stat-line"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={19}/></span></div><strong>{value}</strong><div className="stat-foot">{subtitle||'Dados sincronizados do MySQL'}</div></div>;}
export function Badge({children,tone='slate'}){return <span className={`status status-${tone}`}><i/>{children}</span>;}
export function Empty({title='Nenhum registro encontrado',message='Tente mudar os filtros ou adicione um novo registro.'}){return <div className="empty"><div className="empty-glyph"><Search size={26}/></div><strong>{title}</strong><p>{message}</p></div>;}
export function Loading(){return <div className="loading"><LoaderCircle size={24} className="spin"/> Carregando dados...</div>;}
export function Modal({title,subtitle,onClose,children,wide=false}){return <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true"><div className="modal-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={onClose} title="Fechar"><X size={20}/></button></div><div className="modal-body">{children}</div></div></div>;}
export function Input({label,...props}){return <label className="field">{label&&<span>{label}</span>}<input {...props}/></label>;}
export function Select({label,options=[],placeholder='Selecione...',...props}){return <label className="field">{label&&<span>{label}</span>}<select {...props}><option value="">{placeholder}</option>{options.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>;}
export function SearchBox({value,onChange,placeholder='Buscar...'}){return <div className="search-box"><Search size={18}/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>;}
export function SectionHeader({title,subtitle,action}){return <div className="section-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>;}
export function ChartEmpty(){return <div className="chart-empty">Sem dados no período selecionado.</div>;}
