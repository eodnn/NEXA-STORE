"""Gerador simples de DER vetorial offline para a apresentação (sem dependências)."""
from pathlib import Path
import html
out=Path(__file__).resolve().parent.parent/'docs'/'DER.svg'
entities=[
 ('usuarios',100,100,['PK  id','UQ  email','senha_hash · perfil']),
 ('clientes',100,335,['PK  id','UQ  email','nome · telefone']),
 ('categorias',100,555,['PK  id','UQ  nome','descricao']),
 ('fornecedores',100,740,['PK  id','UQ  email / cnpj','nome']),
 ('vendas',490,210,['PK  id','FK  cliente_id · usuario_id','codigo · status · total']),
 ('itens_venda',850,210,['PK  id','FK  venda_id · produto_id','quantidade · preco_unitario']),
 ('produtos',850,560,['PK  id','FK  categoria_id · fornecedor_id','sku · preco · estoque']),
 ('pagamentos',490,445,['PK  id','FK  venda_id (UNIQUE)','metodo · valor · status']),
 ('movimentacoes_estoque',490,710,['PK  id','FK  produto_id · venda_id','tipo · quantidade · anterior · posterior'])
]
w,h=1240,950
lines=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 950" width="1240" height="950">',
'<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5 0 10" fill="none" stroke="#818cf8" stroke-width="1.6"/></marker></defs>',
'<rect width="1240" height="950" fill="#0b1220"/><text x="70" y="51" fill="#fff" font-family="Arial" font-size="27" font-weight="bold">NEXA STORE</text><text x="315" y="50" fill="#94a3b8" font-family="Arial" font-size="19">Diagrama entidade-relacionamento · MySQL 8</text>',
'<text x="70" y="924" fill="#64748b" font-family="Arial" font-size="14">PK = chave primária   ·   FK = chave estrangeira   ·   UQ = valor único   ·   Linha indica relacionamento por FK</text>']
# Conexões desenhadas antes dos cartões
segments=[((340,155),(490,253),'1:N'),((340,385),(490,295),'1:N'),((340,615),(850,615),'1:N'),((340,805),(850,680),'1:N'),((730,290),(850,290),'1:N'),((990,361),(990,560),'N:1'),((610,361),(610,445),'1:1'),((850,715),(770,770),'N:1')]
for (a,b,label) in segments:
 x1,y1=a;x2,y2=b
 lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#57668e" stroke-width="2" marker-end="url(#arrow)"/>')
 # Label only on clearer longer edges
 if abs(x2-x1)>160 or abs(y2-y1)>150:
  lines.append(f'<text x="{(x1+x2)/2}" y="{(y1+y2)/2-9}" fill="#a5b4fc" font-size="13" font-family="Arial">{label}</text>')
# Relações adicionais são mostradas no DER Mermaid, que é a fonte completa.
# A versão SVG é uma síntese para projeção e evita linhas sobre os cartões.
for title,x,y,fields in entities:
 width=280 if title=='movimentacoes_estoque' else 240
 boxheight=151
 lines.extend([f'<rect x="{x}" y="{y}" width="{width}" height="{boxheight}" rx="13" fill="#17223a" stroke="#354664" stroke-width="2"/>',f'<path d="M{x+13} {y}H{x+width-13}Q{x+width} {y} {x+width} {y+13}V{y+42}H{x}V{y+13}Q{x} {y} {x+13} {y}" fill="#373d87"/>',f'<text x="{x+15}" y="{y+28}" fill="#fff" font-size="16" font-family="Arial" font-weight="bold">{html.escape(title)}</text>'])
 for i,field in enumerate(fields):
  lines.append(f'<text x="{x+15}" y="{y+67+i*25}" fill="{["#a5b4fc","#7dd3fc","#cbd5e1"][i]}" font-family="Arial" font-size="14">{html.escape(field)}</text>')
lines.append('</svg>')
out.write_text('\n'.join(lines),encoding='utf-8')
print(out)
