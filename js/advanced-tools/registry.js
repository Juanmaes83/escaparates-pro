(function(){
  'use strict';
  window.EP=window.EP||{};
  var TOOLS=Object.create(null);
  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalize(def){
    if(!def||!def.id)throw new Error('Advanced Tool requires id');
    if(!def.name)throw new Error('Advanced Tool requires name');
    if(!def.source||!def.source.url||!def.source.commit)throw new Error('Advanced Tool requires pinned source');
    return Object.assign({
      integrationType:'type-b',
      version:'1.0.0',
      family:'RUBIK SOTA',
      status:'foundation',
      capabilities:{localEditing:true,localSave:true,versions:true,pngExport:true,videoExport:true,jsonExport:true,htmlExport:false,embedExport:false,publish:false},
      controls:[],
      media:{mode:'collection',max:15,accept:['image/*','video/*']},
      projectSchemaVersion:1
    },def);
  }
  function register(def){var clean=normalize(def);TOOLS[clean.id]=clean;return clean;}
  function get(id){return TOOLS[id]||null;}
  function getAll(){return Object.keys(TOOLS).map(function(id){return TOOLS[id];});}

  register({
    id:'infinite-display-studio-pro',
    name:'Infinite Display Studio PRO',
    shortName:'Infinite Display',
    family:'RUBIK SOTA',
    icon:'∞',
    version:'1.0.0-type-b-foundation',
    description:'Studio visual inmersivo con 12 modos 3D, media, branding, presentación y outputs.',
    source:{
      repository:'Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO',
      branch:'main',
      commit:'89ee1beb56a0c86c06366bbbb155f421e2d23981',
      blob:'f74424403b3dd276919035e86b3b0abb1c48224c',
      url:'https://cdn.jsdelivr.net/gh/Juanmaes83/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO@89ee1beb56a0c86c06366bbbb155f421e2d23981/index.html',
      fallbackUrl:'https://juanmaes83.github.io/ESCAPARATES-INMERSIVOS-DE-IMAGEN-VIDEO/'
    },
    media:{mode:'collection',max:15,accept:['image/*','video/*'],preserveSourceDefaults:true},
    controls:[
      {key:'displayMode',group:'Experience',type:'select',label:'Display Mode',default:'spiral',options:[
        {v:'spiral',label:'Spiral'},{v:'curl',label:'Curl'},{v:'bands',label:'Bands'},{v:'drift',label:'Drift'},
        {v:'parallax',label:'Parallax'},{v:'galaxy',label:'Galaxy'},{v:'dna',label:'DNA'},{v:'vortex',label:'Vortex'},
        {v:'kaleidoscope',label:'Kaleidoscope'},{v:'fallingrain',label:'Falling Rain'},{v:'mobius',label:'Mobius'},{v:'explodedgrid',label:'Exploded Grid'}
      ]},
      {key:'backgroundColor',group:'Look',type:'color',label:'Background',default:'#0a0a0a'},
      {key:'speed',group:'Look',type:'range',label:'Speed',min:0.05,max:1.5,step:0.05,default:0.3},
      {key:'zoom',group:'Camera',type:'range',label:'Zoom',min:5,max:30,step:0.5,default:12},
      {key:'tiltX',group:'Camera',type:'range',label:'Tilt X',min:-45,max:45,step:1,default:0},
      {key:'tiltZ',group:'Camera',type:'range',label:'Tilt Z',min:-30,max:30,step:1,default:0},
      {key:'planeCount',group:'Geometry',type:'range',label:'Planes',min:10,max:500,step:10,default:200},
      {key:'bandCount',group:'Geometry',type:'range',label:'Bands / Sectors',min:3,max:9,step:2,default:5},
      {key:'bloomEnabled',group:'Post FX',type:'boolean',label:'Bloom',default:true},
      {key:'bloomStrength',group:'Post FX',type:'range',label:'Bloom Strength',min:0,max:3,step:0.05,default:0.8},
      {key:'bloomRadius',group:'Post FX',type:'range',label:'Bloom Radius',min:0,max:1,step:0.05,default:0.3},
      {key:'bloomThreshold',group:'Post FX',type:'range',label:'Bloom Threshold',min:0,max:1,step:0.05,default:0.6},
      {key:'vignetteEnabled',group:'Post FX',type:'boolean',label:'Vignette',default:true}
    ],
    brandingControls:[
      {key:'overlayEnabled',type:'boolean',label:'Enable Branding',default:false},
      {key:'headline',type:'text',label:'Headline',default:'',maxLength:120},
      {key:'cta',type:'text',label:'CTA',default:'',maxLength:120},
      {key:'logoPosition',type:'select',label:'Logo Position',default:'bottom-right',options:[{v:'top-left',label:'Top left'},{v:'top-right',label:'Top right'},{v:'bottom-left',label:'Bottom left'},{v:'bottom-right',label:'Bottom right'}]},
      {key:'logoOpacity',type:'range',label:'Logo Opacity',min:0,max:1,step:0.05,default:1},
      {key:'textOpacity',type:'range',label:'Text Opacity',min:0,max:1,step:0.05,default:1},
      {key:'fontSize',type:'range',label:'Font Size',min:12,max:80,step:1,default:28},
      {key:'fontColor',type:'color',label:'Font Color',default:'#ffffff'},
      {key:'logoScale',type:'range',label:'Logo Scale',min:0.05,max:0.4,step:0.01,default:0.15}
    ],
    presentation:{modes:['spiral','curl','galaxy','dna','vortex','kaleidoscope','fallingrain','mobius','explodedgrid','bands','drift','parallax'],intervalMs:15000}
  });

  register({
    id:'banderolas-studio-pro',
    name:'Banderolas Studio PRO',
    shortName:'Banderolas',
    family:'RUBIK SOTA',
    icon:'〰',
    version:'1.0.0-type-b',
    status:'visual-review',
    description:'Authoring Type B para banderolas/tela dinámica con motor WebGL + Verlet/cloth preservado, media, composición, proyectos y outputs.',
    source:{
      repository:'Juanmaes83/BANDEROLAS-DINAMICAS',
      branch:'preview-output-v2',
      commit:'538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83',
      entrypoint:'index.html',
      outputReference:'index-output-v2.html',
      enhancerReference:'output-enhancer-v2.js',
      url:'https://cdn.jsdelivr.net/gh/Juanmaes83/BANDEROLAS-DINAMICAS@538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83/index.html',
      fallbackUrl:'https://cdn.jsdelivr.net/gh/Juanmaes83/BANDEROLAS-DINAMICAS@538146f7ec2ddbd056b55da0ed0eb8a1cf96ef83/index-output-v2.html'
    },
    capabilities:{localEditing:true,localSave:true,versions:true,pngExport:true,videoExport:true,jsonExport:true,htmlExport:true,embedExport:true,publish:false},
    media:{mode:'single',max:1,accept:['image/*','video/*'],preserveSourceDefaults:true},
    projectSchemaVersion:1
  });

  EP.AdvancedTools={register:register,get:get,getAll:getAll,clone:clone};
})();
