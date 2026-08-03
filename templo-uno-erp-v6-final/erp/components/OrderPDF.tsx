import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
interface Product{name:string;reference?:string;color?:string;size?:string;quantity:number;unit_value:number;total_value:number;}
interface ChecklistItem{step:string;completed:boolean;completed_at?:string;user_name?:string;}
interface Payment{amount:number;method:string;paid_at:string;}
interface OrderData{number:string;notes?:string;client_name?:string;client_phone?:string;client_email?:string;client_city?:string;client_state?:string;company_name?:string;company_color?:string;entry_date:string;expected_date:string;delivery_date?:string;status:string;payment_status:string;payment_method?:string;total_value:number;received_value:number;products?:Product[];checklist?:ChecklistItem[];payments?:Payment[];}
const fC=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const fD=(d?:string)=>{if(!d)return '-';try{return new Intl.DateTimeFormat('pt-BR').format(new Date(d));}catch{return d;}};
const SL:Record<string,string>={producao:'Em Produção',entregue:'Entregue',atrasado:'Atrasado'};
const SC:Record<string,string>={producao:'#D97706',entregue:'#16A34A',atrasado:'#DC2626'};
const PC:Record<string,string>={pago:'#16A34A',pendente:'#DC2626',parcial:'#D97706'};
const ML:Record<string,string>={pix:'PIX',transferencia:'Transferência',dinheiro:'Dinheiro',cartao:'Cartão',boleto:'Boleto'};
const s=StyleSheet.create({
  page:{fontFamily:'Helvetica',fontSize:9,color:'#1a1a1a',backgroundColor:'#fff',paddingTop:36,paddingBottom:48,paddingHorizontal:40},
  hdr:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:28,paddingBottom:20,borderBottomWidth:2,borderBottomColor:'#f0f0f0'},
  logo:{width:36,height:36,borderRadius:8,justifyContent:'center',alignItems:'center'},
  sec:{marginBottom:18},
  secT:{fontSize:7,fontFamily:'Helvetica-Bold',color:'#888',textTransform:'uppercase',letterSpacing:1,marginBottom:8,paddingBottom:4,borderBottomWidth:1,borderBottomColor:'#f0f0f0'},
  grid:{flexDirection:'row',flexWrap:'wrap'},
  gi:{width:'50%',marginBottom:10},
  gl:{fontSize:7,color:'#888',marginBottom:2},
  gv:{fontSize:9,color:'#111',fontFamily:'Helvetica-Bold'},
  tbl:{borderWidth:1,borderColor:'#e8e8e8',borderRadius:6,overflow:'hidden'},
  th:{flexDirection:'row',backgroundColor:'#f8f8f8',paddingVertical:7,paddingHorizontal:10},
  tc:{fontSize:7,fontFamily:'Helvetica-Bold',color:'#666',textTransform:'uppercase'},
  tr:{flexDirection:'row',paddingVertical:7,paddingHorizontal:10,borderTopWidth:1,borderTopColor:'#f0f0f0'},
  td:{fontSize:8.5,color:'#222'},
  fin:{borderWidth:1,borderColor:'#e8e8e8',borderRadius:6,overflow:'hidden'},
  fr:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9,paddingHorizontal:14,borderTopWidth:1,borderTopColor:'#f0f0f0'},
  frl:{fontSize:8.5,color:'#555'},
  frv:{fontSize:8.5,fontFamily:'Helvetica-Bold',color:'#111'},
  ftot:{flexDirection:'row',justifyContent:'space-between',paddingVertical:11,paddingHorizontal:14,backgroundColor:'#111'},
  cg:{flexDirection:'row',flexWrap:'wrap',gap:6},
  ci:{width:'23%',padding:8,borderRadius:5,borderWidth:1,alignItems:'center'},
  nb:{position:'absolute',bottom:24,left:40,right:40,flexDirection:'row',justifyContent:'space-between',paddingTop:10,borderTopWidth:1,borderTopColor:'#e8e8e8'},
});
export function OrderPDFDocument({order}:{order:OrderData}){
  const prods=order.products||[];const ck=order.checklist||[];const pays=order.payments||[];
  const sc=SC[order.status]||'#666';const pc=PC[order.payment_status]||'#666';const cc=order.company_color||'#EAB308';
  const pend=(order.total_value||0)-(order.received_value||0);
  const now=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date());
  const C=['30%','12%','11%','10%','9%','14%','14%'];
  return(
    <Document title={`Pedido ${order.number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.hdr}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <View style={[s.logo,{backgroundColor:cc}]}><Text style={{fontSize:14,fontFamily:'Helvetica-Bold',color:'#000'}}>TU</Text></View>
            <View><Text style={{fontSize:13,fontFamily:'Helvetica-Bold',color:'#111'}}>{order.company_name||'Templo Uno'}</Text><Text style={{fontSize:8,color:'#888',marginTop:2}}>Templo Uno Corp · ERP</Text></View>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={{fontSize:18,fontFamily:'Helvetica-Bold',color:'#111'}}>{order.number}</Text>
            <Text style={{fontSize:8,color:'#888',marginTop:2}}>Ordem de Serviço</Text>
            <View style={{flexDirection:'row',gap:6,marginTop:6}}>
              <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:20,backgroundColor:`${sc}20`,borderWidth:0.5,borderColor:sc}}><Text style={{color:sc,fontSize:7,fontFamily:'Helvetica-Bold'}}>{SL[order.status]||order.status}</Text></View>
              <View style={{paddingHorizontal:8,paddingVertical:3,borderRadius:20,backgroundColor:`${pc}20`}}><Text style={{color:pc,fontSize:7,fontFamily:'Helvetica-Bold'}}>{order.payment_status==='pago'?'Pago':order.payment_status==='parcial'?'Parcial':'Pendente'}</Text></View>
            </View>
          </View>
        </View>
        <View style={s.sec}><Text style={s.secT}>Dados do Pedido</Text>
          <View style={s.grid}>
            {[['Cliente',order.client_name],['Empresa',order.company_name],['Telefone',order.client_phone],['Email',order.client_email],['Entrada',fD(order.entry_date)],['Previsão',fD(order.expected_date)],['Entrega',fD(order.delivery_date)],['Pagamento',order.payment_method?ML[order.payment_method]||order.payment_method:'-']].filter(([,v])=>v).map(([l,v])=>(
              <View key={String(l)} style={s.gi}><Text style={s.gl}>{l}</Text><Text style={s.gv}>{v||'-'}</Text></View>
            ))}
          </View>
        </View>
        {prods.length>0&&<View style={s.sec}><Text style={s.secT}>Produtos ({prods.length})</Text>
          <View style={s.tbl}>
            <View style={s.th}>{['Produto','Ref','Cor','Tam','Qtd','Unit.','Total'].map((h,i)=><Text key={h} style={[s.tc,{width:C[i],textAlign:i>4?'right':'left'}]}>{h}</Text>)}</View>
            {prods.map((p,i)=><View key={i} style={[s.tr,i%2===1?{backgroundColor:'#fafafa'}:{}]}><Text style={[s.td,{width:C[0],fontFamily:'Helvetica-Bold'}]}>{p.name}</Text><Text style={[s.td,{width:C[1],color:'#666'}]}>{p.reference||'-'}</Text><Text style={[s.td,{width:C[2],color:'#666'}]}>{p.color||'-'}</Text><Text style={[s.td,{width:C[3],color:'#666'}]}>{p.size||'-'}</Text><Text style={[s.td,{width:C[4],textAlign:'right'}]}>{p.quantity}</Text><Text style={[s.td,{width:C[5],textAlign:'right',color:'#555'}]}>{fC(p.unit_value)}</Text><Text style={[s.td,{width:C[6],textAlign:'right',fontFamily:'Helvetica-Bold'}]}>{fC(p.total_value||p.quantity*p.unit_value)}</Text></View>)}
          </View>
        </View>}
        <View style={s.sec}><Text style={s.secT}>Financeiro</Text>
          <View style={s.fin}>
            <View style={[s.fr,{borderTopWidth:0}]}><Text style={s.frl}>Total</Text><Text style={s.frv}>{fC(order.total_value)}</Text></View>
            <View style={s.fr}><Text style={s.frl}>Recebido</Text><Text style={[s.frv,{color:'#16A34A'}]}>{fC(order.received_value)}</Text></View>
            {pays.map((p,i)=><View key={i} style={[s.fr,{paddingLeft:24}]}><Text style={[s.frl,{color:'#aaa',fontSize:7.5}]}>{fD(p.paid_at)} · {ML[p.method]||p.method}</Text><Text style={[s.frv,{color:'#16A34A',fontSize:7.5}]}>{fC(p.amount)}</Text></View>)}
            <View style={s.ftot}><Text style={{fontSize:9,fontFamily:'Helvetica-Bold',color:'#fff'}}>Saldo Pendente</Text><Text style={{fontSize:11,fontFamily:'Helvetica-Bold',color:'#fff'}}>{fC(pend)}</Text></View>
          </View>
        </View>
        {ck.length>0&&<View style={s.sec}><Text style={s.secT}>Produção — {ck.filter(c=>c.completed).length}/{ck.length} etapas</Text>
          <View style={s.cg}>{ck.map((item,i)=><View key={i} style={[s.ci,{backgroundColor:item.completed?'#f0fdf4':'#fafafa',borderColor:item.completed?'#86efac':'#e8e8e8'}]}>
            <View style={{width:10,height:10,borderRadius:5,backgroundColor:item.completed?'#22C55E':'#d1d5db'}}/>
            <Text style={{fontSize:7.5,fontFamily:'Helvetica-Bold',marginTop:4,textAlign:'center',color:item.completed?'#15803d':'#555'}}>{item.step}</Text>
            {item.completed&&item.completed_at&&<Text style={{fontSize:6,color:'#888',marginTop:2,textAlign:'center'}}>{fD(item.completed_at)}</Text>}
          </View>)}</View>
        </View>}
        {order.notes&&<View style={s.sec}><Text style={s.secT}>Observações</Text><View style={{backgroundColor:'#fafafa',borderWidth:1,borderColor:'#e8e8e8',borderRadius:6,padding:12}}><Text style={{fontSize:8.5,color:'#444',lineHeight:1.5}}>{order.notes}</Text></View></View>}
        <View style={s.nb} fixed><Text style={{fontSize:7,color:'#aaa'}}>Templo Uno Corp ERP · {now}</Text><Text style={{fontSize:7,color:'#aaa'}} render={({pageNumber,totalPages})=>`Página ${pageNumber} de ${totalPages}`}/></View>
      </Page>
    </Document>
  );
}
