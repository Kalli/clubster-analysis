// taken from: https://observablehq.com/@gka/cheap-fit-text-to-circle
const CHAR_W = {
	A:7,a:7,B:8,b:7,C:8,c:6,D:9,d:7,E:7,e:7,F:7,f:4,G:9,g:7,H:9,h:7,I:3,i:3,
	J:5,j:3,K:8,k:6,L:7,l:3,M:11,m:11,N:9,n:7,O:9,o:7,P:8,p:7,Q:9,q:7,R:8,
	r:4,S:8,s:6,T:7,t:4,U:9,u:7,V:7,v:6,W:11,w:9,X:7,x:6,Y:7,y:6,Z:7,z:5,
	'.':2,',':2,':':2,';':2
}

function fitTextToScreen(text, radius){
	const fittedText = text.split("").reduce((acc, e) => {
		if (acc.length < radius){
			acc.length = acc.length + (CHAR_W[e] || CHAR_W.a)
			acc.text = acc.text + e
		}
		return acc
	}, {length: 0, text: ''}).text
	if (fittedText === text){
		return text
	}
	return fittedText + "..."
}

export {fitTextToScreen}