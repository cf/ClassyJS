Object.defineProperty(String.prototype, "cc",{get:function(){ return this.charCodeAt(0); }});
Object.defineProperty(String.prototype, "isClear",{get:function(){ return this.charCodeAt(0)<0x21; }});
function isAlNum(c){return (c>0x60&&c<0x7B)||(c>0x40&&c<0x5B)||(c>0x2F&&c<0x3A)||c==0x2e;};
function isAlNumStr(ca){for(var i=0;i<ca.length;i++){var c=ca.charCodeAt(i); if(!((c>0x60&&c<0x7B)||(c>0x40&&c<0x5B)||(c>0x2F&&c<0x3A)||c==0x2e)) return false;} return true;};
function errmsg(msg){ alert(msg); return false; };
function Tokenizer(data)
{
	this.data=data;
	this.tokens=[];
	this.inds=[];
	this.tTypes=[];
	this.strings=[];
	
	this.addToken=function(t,ind,type)
	{
		this.tokens.push(t);
		this.inds.push(ind);
		//this.tTypes.push(type);
	};
	this.tokenize=function()
	{
		var d=this.data;
		var ts="";
		var qs=-1;
		var lc="";
		for(var i=0;i<d.length;i++)
		{
			if(data[i].charCodeAt(0)<0x21) continue;
			if(data[i]=='"')
			{
				var ci=data.indexOf('"',i+1);
				if(ci==-1) return errmsg("String error at position "+i);
				var ca;
				while((ca=data[ci-1])=="\\")
				{
					ci=data.indexOf('"',ci+1);
					if(ci==-1) return errmsg("String error at position "+i);
				}
				ts=data.substring(i+1,ci);
				this.addToken("¨"+this.strings.length+"¨", i);
				this.strings.push(ts);
				i=ci;
				
			}else if(isAlNum(data[i].cc))
			{
				var st=i;
				ts="";
				while(isAlNum(data[i].cc))
					ts+=data[i++];
				i--;
				this.addToken(ts,st);
			}else{
				if(i+1<data.length&&(data[i]==data[i+1]||data[i+1]=="="))
					this.addToken(data[i]+data[i+1],i++);
				else
					this.addToken(data[i],i);
			}
		}
		return true;
	};
}
var classes=[];
function classByName(name)
{
	for(var i=0;i<classes.length;i++) if(classes[i].name==name) return classes[i];
	return false;
}
var tkn;
function Class(name)
{
	this.name=name;
	this.vars=[];
	this.constructor="";
	this.args="";
	this.parent=null;
	this.stok=0;
	this.etok=0;
	this.getVName=function(varname)
	{
		
		/*if(this.parent!=null)
		{
			var tv;
			if(tv=this.parent.getVName(varname)!=varname) return +tv;
		}*/
		if(this.vars.indexOf(varname.split(".")[0])!=-1) return "this."+varname;
		return varname;
	};
	this.addVar=function(vname,defVal){this.vars.push(vname);return this.vars.length-1;};
	classes.push(this);
}
var newCode="";
function codeParser(incode)
{
	classes=[];
	var tok=new Tokenizer(incode);
	tkn=tok;
	if(!tok.tokenize()) return false;
	var toks=tok.tokens;
	var i;
	var isVarLine=false;
	for(i=0;i<toks.length;i++)
	{
		if(toks[i]=="class"&&toks[i+2]=="{")
		{
			var cls=new Class(toks[i+1]);
			cls.stok=i;
			i+=2;
			var isFdef=false;
			var nOpen=1,nClosed=0;
			while(nOpen!=nClosed)
			{
				i++;
				if(!toks[i]) return errmsg('Brace Error at token '+cls.stok);
				if(toks[i]==";")isVarLine=false;
				if(nOpen-nClosed===1&&(toks[i]=="var"||(isVarLine&&toks[i]==","&&(toks[i+2]=="="||toks[i+2]==";"||(toks[i+2]==","&&!isFdef))))){ if(toks[i]!=",") toks[i]=""; cls.vars.push(toks[i+1]); }
				else if(nOpen-nClosed===1&&(toks[i]=="function"||toks[i]=="public")&&toks[i+1]!="(")
				{
				isFdef=true;
					if(toks[i+1]==cls.name)
					{
						toks[i+1]=cls.constructor="$__con__"+toks[i+1];
						var tss="";
						var a2=i+3;
						while(toks[a2]!=")")
						{
							if(toks[a2]!=",")
								tss+="$$_$"+toks[a2++];
							else
								tss+=toks[a2++];
						}
						
						cls.args=tss;
					}
					cls.vars.push(toks[i+1]);
					toks[i]="this."+toks[i+1];
					toks[i+1]="= function";
				}
				else if(toks[i]=="{") nOpen++;
				else if(toks[i]=="}"){ 
					nClosed++;
					if(nOpen-nClosed===1)
					{
						isFdef=false;
						toks[i]="};";
					}
				}
				isVarLine=true;
			}
			
			cls.etok=i;
			toks[i]+=";";
		}
	}
	var ccls=false;
	var cmax=0;
	var dCls=false;
	for(i=0;i<toks.length;i++)
	{
		if(i>=cmax) ccls=false;
		if(!ccls)
		{
			for(var h=0;h<classes.length;h++)
				if(i>classes[h].stok&&i<classes[h].etok){ ccls=classes[h]; cmax=ccls.etok; break; }
		}
		if(ccls)
		{
			if(isAlNumStr(toks[i]))
			{
				toks[i]=ccls.getVName(toks[i]);
			}
		}
		if(toks[i]=="class")
		{
			dCls=classByName(toks[i+1]);
			if(dCls)
				toks[i]="function "+toks[i+1]+"("+dCls.args+")";
			else return errmsg("Error finding class named '"+toks[i+1]+"'");
			toks[i+1]="{";
			toks[i+2]="";
			
		}
		if(dCls&&i==dCls.etok)
		{
			if(dCls.constructor.length)
				toks[i]=" this."+dCls.constructor+"("+dCls.args+"); "+toks[i];
		}
		if(toks[i].cc==0xA8)
		{
			var strind=parseInt(toks[i].substring(1,toks[i].length-1),10);
			toks[i]='"'+tok.strings[strind]+'"';
		}
	}
	newCode=toks.join(" ");
	return true;
}

function runCode(input)
{
	var success=codeParser(input);
	if(!success) return "Compile Error";
	return newCode;
}
