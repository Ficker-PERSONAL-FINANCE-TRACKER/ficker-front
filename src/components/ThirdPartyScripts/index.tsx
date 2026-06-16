import Script from "next/script";

const MAZE_SNIPPET = `
(function (m, a, z, e) {
  var s, t, u, v;
  try {
    t = m.sessionStorage.getItem('maze-us');
  } catch (err) {}

  if (!t) {
    t = new Date().getTime();
    try {
      m.sessionStorage.setItem('maze-us', t);
    } catch (err) {}
  }

  u = document.currentScript || (function () {
    var w = document.getElementsByTagName('script');
    return w[w.length - 1];
  })();
  v = u && u.nonce;

  s = a.createElement('script');
  s.src = z + '?apiKey=' + e;
  s.async = true;
  if (v) s.setAttribute('nonce', v);
  a.getElementsByTagName('head')[0].appendChild(s);
  m.mazeUniversalSnippetApiKey = e;
})(window, document, 'https://snippet.maze.co/maze-universal-loader.js', 'c0cabf66-9df7-4e46-9ef9-3f4ce021218c');
`;

const UXTWEAK_SNIPPET = `
(function(u,x,t,w,e,a,k,s){a=function(v){try{u.setItem(t+e,v)}catch(e){}v=JSON.parse(v);for(k=0;k<v.length;k++){s=x.createElement("script");s.text="(function(u,x,t,w,e,a,k){a=u[e]=function(){a.q.push(arguments)};a.q=[];a.t=+new Date;a.c=w;k=x.createElement('script');k.async=1;k.src=t;x.getElementsByTagName('head')[0].appendChild(k)})(window,document,'"+v[k].u+"',"+JSON.stringify(v[k].c)+",'"+v[k].g+"')";x.getElementsByTagName("head")[0].appendChild(s)}};try{k=u.getItem(t+e)}catch(e){}if(k){return a(k)}k=new XMLHttpRequest;k.onreadystatechange=function(){if(k.readyState==4&&k.status==200)a(k.responseText)};k.open("POST",w+e);k.send(x.URL)})(sessionStorage,document,"uxt:","https://api.uxtweak.com/snippet/","6df4e9e7-4cc5-4220-9829-2077e30fbf42");
`;

const ThirdPartyScripts = () => (
  <>
    <Script
      id="maze-universal-snippet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: MAZE_SNIPPET }}
    />
    <Script
      id="uxtweak-snippet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: UXTWEAK_SNIPPET }}
    />
    <Script
      id="useberry-script"
      strategy="afterInteractive"
      src="https://api.useberry.com/integrations/liveUrl/scripts/useberryScript.js"
    />
  </>
);

export default ThirdPartyScripts;
