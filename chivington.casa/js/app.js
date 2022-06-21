// --------------------------------------------------------------------------------------------
// Author: Johnathan Chivington
// Project: Personal blog, resume and research portfolio.
// Description: Personal web application built in my custom UI/UX framework, Unity.
// Version: 2.0.0 - (production - see README.md)
// License: None
// --------------------------------------------------------------------------------------------

// --------------------------------------------------------------------------------------------
//  Unity - A minimal state/UI framework for building complex "native-like" web applications.
// --------------------------------------------------------------------------------------------
const Unity = {
  reducer: function(defaultState,map) {
    return function(state = defaultState, action) {
      return map[action.type] ? map[action.type](state, action) : state;
    }
  },
  combine: function(reducers) {
    return function(state, action) {
      return Object.keys(reducers).reduce((combined, k) => {
        combined[k] = reducers[k](state[k], action);
        return combined;
      }, {});
    }
  },
  store: function(rootReducer,middlewares={},history_length) {
    const { logActions, listenerBypass, cacheChat } = middlewares;
    let state = {}, listeners = [], history = [];

    function getState() { return state; }
    function getHistory() { return history; }

    function dispatch(action) {
      if (logActions) logActions('before', state, action);
      if (!!history_length) history = (history.length == history_length) ? [...history.slice(1), state] : [...history, state];
      state = rootReducer(state, action);
      if (logActions) logActions('after', state, action);

      if (listenerBypass && listenerBypass(action.type)[0])
        listeners.forEach(listener => listenerBypass(action.type).forEach(bypassName => {
          if (bypassName != listener.name) listener.function(...listener.params);
        }));
      else listeners.forEach(listener => listener.function(...listener.params));
    }

    function subscribe(listener) {
      listeners.push(listener);
      return () => { listeners = listeners.filter(l => l !== listener); }
    }

    dispatch({type:'@@INIT'});
    return { getState, getHistory, dispatch, subscribe };
  },
  middlewares: {
    logActions: function(initAction = '') {
      return function(stage, state, action) {
        if  (action.type != initAction) {
          if (stage == 'before') {
            console.log('\n%cPrevious State: ', 'font-weight: bold; color: #0b0;', state);
            console.log(`Action Dispatched: %c'${action.type}'`, 'color: #e00;');
            console.log(`Action Payload: `, action.payload);
          }
          if (stage == 'after')
            console.log('%cUpdated State: ', 'font-weight: bold; color: #0b0;', state);
        }
      }
    },
    listenerBypass: function(bypassActions = {}) {
      return function(actionType) {
        return bypassActions[actionType] || [];
      }
    }
  },
  element: function(elem,attrs,children) {
    const element = document.createElement(elem);
    if (attrs) Object.keys(attrs).forEach(k => element.setAttribute(k, attrs[k]));
    if (children.length >= 1) children.forEach(child => element.appendChild((typeof child == 'string')
      ? document.createTextNode(child) : ((child.elem) ? child.elem(child.props, child.dispatch, child.children) : child)
    ));
    return element;
  },
  render: function(component,store,root) {
    while (root.lastChild) root.lastChild.remove();
    root.appendChild(component(store));
  },
  initialize: function(app_root,load_screen_root,blueprint,reducers,middlewares) {
    const app_title = blueprint.user.name ? blueprint.user.name : 'Unity Application';
    document.title = `${app_title} | Home`;
    if (!app_root) Unity.terminate(app_root,`No Application Root supplied...`);
    if (!blueprint) Unity.terminate(app_root,`No Blueprint supplied...`);
    if (!!load_screen_root) {console.log(`${app_title} | Killing load screen...`);load_screen_root.style.display='none';};
    console.log(`${app_title} | Killing static application...`);
    app_root.firstElementChild.style.display = 'none';
    const init_state = Unity.combine(reducers);
    const UnityStore = Unity.store(init_state, middlewares);
    Unity.render(Modules.App, UnityStore, App_Root);
    UnityStore.subscribe({name:'Render_App',function:Unity.render,params:[Modules.App,UnityStore,App_Root]});
  },
  terminate: function(app_root,msg) {
    while (app_root.lastChild) app_root.lastChild.remove();
    app_root.appendChild(Unity.element('div',{position:`absolute`,left:0,top:0,bottom:0,right:0,index:1000,background:`linear-gradient(#fff,#eee)`},[msg]));
    throw `[Unity] - ${msg}`;
  }
};

// --------------------------------------------------------------------------------------------
//  Modules - Important/reused widgets, UI, etc.
// --------------------------------------------------------------------------------------------
const Modules = {
  Router: function(store) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const {mapState,viewState} = state.uiState;
    const {current,previous} = viewState;
    const sameView = viewState.current==viewState.previous;
    const lastAction = state.appState.historyState.actions.slice(-1)[0];
    const animateActions = ['BEGIN_THREAD', 'DELETE_THREAD', 'DELETE_THREADS'];
    const st = {router: `position:fixed; top:0; right:0; bottom:0; left:0; overflow:hidden; z-index:5;`};
    const selected = mapState[current]?mapState[current]:mapState['DEFAULT'];
    const animation = (lastAction=='NAV_TO' && !sameView || animateActions.includes(lastAction)) ? `animation:viewSlideIn 250ms 1 forwards;` : ``;
    document.title = `${state.appState.aboutState.name} | ${selected.title}`;
    return Unity.element('div', {style:st.router}, [Modules.View(store, selected.view, animation)]);
  },
  Header: function(store) {
    const [ state, dispatch ] = [ store.getState(), store.dispatch ];
    const { uiState } = state;
    const { viewState, menuState, windowState } = uiState;
    const { icons } = Assets.imgs;
    const { current, previous } = menuState;
    const dark_theme = uiState.themeState.selected == 'dark';
    const icon_img = dark_theme ? icons.manifest.favicon_wht : icons.manifest.favicon;
    const menu_img = dark_theme ? (current == 'OPEN' ? icons.btns.close_wht : icons.btns.menu_wht)  : (current == 'OPEN' ? icons.btns.close_blk : icons.btns.menu_blk);
    const last_action = state.appState.historyState.actions.slice(-1)[0];
    const open_action = !!(previous == 'CLOSED' && current == 'OPEN');
    const close_action = !!(previous == 'OPEN' && current == 'CLOSED');
    const menu_action = !!(last_action == 'OPEN_MENU' || last_action == 'CLOSE_MENU' || last_action == 'TOGGLE_MENU');
    const lg_dev = (windowState.mode == 'pc' || windowState.mode == 'lg_tab');
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;

    const st = {
      header: `
        position: fixed; top: 0; left: 0; width: 100%; height: ${lg_dev?'5':'4'}em; margin: 0; padding: 0; z-index: 90;
        display: flex; flex-direction: row; justify-content: space-between; align-items: center;
        background-color: ${theme.header}; border-bottom: 1pt solid ${theme.header_bdr}; -webkit-box-shadow: 1pt 1pt ${dark_theme?'2':'5'}pt 0 ${theme.header_bdr};
		animation:headerSlideIn 250ms 1 forwards;
      `,
      header_left: `display: flex; flex-direction: row; justify-content: flex-start; align-items: center;`,
      header_right: `display: flex; flex-direction: row; justify-content: flex-end; align-items: center;`,
      icon: `margin: 0 0 0 1em; padding: 0; height: 4em; width: 4em; cursor:pointer;`,
      super: `font-size: 0.9em; color: ${theme.header_txt}; margin: -1.25em 0 0 0.25em;`,
      menu_btn: `margin: 1em 1.5em; height: 2.5em; width: 2.5em; cursor:pointer; ${open_action ? `animation: menu_btn_opening 300ms ease-in-out 1 forwards;` : (close_action ? (last_action==`REFRESH_THREADS`?``:`animation: menu_btn_closing 300ms ease-in-out 1 forwards;`) : ``)}`,
      header_menu: `display: flex; flex-direction: row; justify-content: center; align-items: center; flex-wrap: wrap; margin: 0; padding: 0;`,
      header_btn: `margin: 0 0.25em; padding: 0.5em 1em; font-size: 1em; text-align: center; color: ${theme.view_txt}; cursor: pointer;`,
      header_qt: `margin: 0 0.25em; padding: 0.5em 1.25em; font-size: 1em; text-align: center; color: ${theme.menu_txt}; background-color: ${theme.btn}; border: 1pt solid ${theme.menu_bdr}; cursor: pointer;`
    };

    const header_icon = E('img', {style:st.icon, src: icon_img, alt: `Header Icon`}, []);
    header_icon.addEventListener('click', function(event) {
      if (viewState.current != 'HOME') dispatch({type:'NAV_TO',payload:'HOME'});
      if (viewState.current == 'HOME' && current == 'OPEN') dispatch({type:'CLOSE_MENU'});
    });

    const superscript = E('sup', {style:st.super}, [state.uiState.mapState[viewState.current].title]);

	const routes = ['HOME', 'ABOUT', 'DOG_FEEDER', 'DOG_CAM'];
    const header_menu = E('div', {style:st.header_menu}, routes.map((route, i, arr) => {
      const map_route = state.uiState.mapState[route];
      const btn = E('h2', {style:st.header_btn}, [map_route.title]);
      btn.addEventListener('click', () => { if (viewState.current != route) dispatch({type:'NAV_TO',payload:route}); });
      return btn;
    }));

    const menu_btn = E('img', {style:st.menu_btn, src: menu_img, alt: 'Menu Button Icon'}, []);
    menu_btn.addEventListener('click', function(event) { dispatch({type:'TOGGLE_MENU'}); });

	const Header = E('div', {style:st.header}, [
      E('div', {style:st.header_left}, [ header_icon, superscript ]),
      E('div', {style:st.header_right}, windowState.mode == 'pc' ? [header_menu, menu_btn] : [menu_btn]),
    ])

	// Header.addEventListener('scroll', function(event) {
    //   const [current_st,event_st] = [viewState.scrollTop,event.target.scrollTop];
    //   const diff = (event_st-current_st)<0?-(event_st-current_st):(event_st-current_st);
    //   if (scroll_ctr++ %2==0 && diff>5) dispatch({type:'UPDATE_MENU_SCROLL',payload:event_st});
    // },false);

    return Header;
  },
  Menu: function(store) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const {menuState,windowState,themeState,mapState} = state.uiState;
    const dark_theme = themeState.selected=='dark';
    const {icons} = Assets.imgs;
    const menuWidth = ((windowState.mode=='pc')||(windowState.mode=='lg_tab'))?`35%`:`100%`;
    const current_view = state.uiState.viewState.current;
    const theme = state.uiState.themeState[state.uiState.themeState.selected];
    const last_action = state.appState.historyState.actions.slice(-1);
    const closed_menu_last = !!(last_action=='CLOSE_MENU'||last_action=='TOGGLE_MENU');
    const landscape = state.uiState.windowState.orientation == 'LANDSCAPE' ? true : false;
    const E = Unity.element;

    const st = {
      menu: `
        position:fixed; top:${landscape?'5':'4'}em; left:0; bottom:0; width:${menuWidth}; padding:0; z-index:80; background-color:${theme.menu}; overflow-y:scroll; ${landscape?`border-right:1pt solid ${theme.menu_bdr};`:''}
        ${(menuState.current=='OPEN')?(menuState.previous=='OPEN'?``:`animation:menu_opening 300ms ease-in-out 1 forwards;`):(closed_menu_last?`animation:menu_closing 300ms ease-in-out 1 forwards;`:`display:none;`)}
      `,
      submenu: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:2em 0 0; padding:0;`,
      route: `display:flex; flex-direction:row; justify-content:center; align-items:center; margin:1em; padding:0; color:${theme.lt_txt};`,
      route_title: `margin:0; padding:0; font-size:1.5em; color:${theme.lt_txt}; border-bottom:1pt solid ${theme.menu_bdr};`,
      toggle: `display:flex; flex-direction:row; justify-content:center; align-items:center; margin:2em; padding:0;`,
      tg_txt: `margin:0; padding:0; color:${theme.lt_txt}`,
      tg_btn: `margin:1em; padding:${dark_theme?'0 1.5em 0 0':'0 0 0 1.5em'}; background-color:${theme.panel}; border:1.25pt solid ${dark_theme?theme.success:theme.menu_bdr}; border-radius:1.5em; cursor:pointer;`,
      slider: `height:1.5em; width:1.5em; margin:0; padding:0; background-color:${dark_theme?theme.success:theme.btn}; border-radius:100%;`,
      copy: `
        display:flex; flex-direction:column; justify-content:space-between; align-items:stretch; text-align:center; color:${theme.menu_bdr};
        border-top:1px solid ${theme.menu_bdr}; margin:1em ${landscape?'5em 5':'2em 2em 1'}em; padding:1.5em; font-size:${landscape?'1':'0.9'}em;
      `,
      usa: `height:1.5em; margin:0.25em; font-size:1.1em; color:${theme.menu_txt};`,
      copy_txt: `font-size:1.1em; margin:0; color:${theme.menu_txt};`
    };

    const routes = Object.keys(state.uiState.mapState).filter(k => !['CHAT','LOGIN','STAGING','DEFAULT'].includes(k));
    const submenu = E('div', {style:st.submenu}, routes.map(r => {
      const route = E('div', {style:st.route}, [E('h2', {style:st.route_title}, [state.uiState.mapState[r].title])]);
      route.addEventListener('click', e => dispatch({type:'NAV_TO', payload:r}));
      return route;
    }));

    const copy = E('div', {style:st.copy}, [
      E('img',{src:icons.btns.usa,alt:`USA Icon`,style:st.usa},[]),
      E('p',{style:st.usa},['United States']),
      E('p',{style:st.copy_txt},['Copyright © 2021 chivington.casa']),
    ]);
    copy.firstChild.addEventListener('click',e=>dispatch({type:`NAV_TO`,payload:`LOGIN`}));

    const toggle = E('div',{style:st.toggle},[E('h4',{style:st.tg_txt},[`Toggle dark mode`]),E('div',{style:st.tg_btn},[E('div',{style:st.slider},[])])]);
    toggle.lastChild.addEventListener('click',()=>dispatch({type:'TOGGLE_THEME',payload:store.getState().uiState.menuState.scrollTop}));

    const Menu = Unity.element('div',{style:st.menu},[submenu,toggle,copy]);
    setTimeout(event=>Menu.scrollTo({top:menuState.scrollTop,left:0,behavior:'auto'}),50);

    let scroll_ctr = 0;
    Menu.addEventListener('scroll', function(event) {
      const [current_st,event_st] = [menuState.scrollTop,event.target.scrollTop];
      const diff = (event_st-current_st)<0?-(event_st-current_st):(event_st-current_st);
      if (scroll_ctr++ %2==0 && diff>5) dispatch({type:'UPDATE_MENU_SCROLL',payload:event_st});
    },false);

    return Menu;
  },
  View: function(store,view,animation) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const {windowState,viewState,menuState,themeState} = state.uiState;
    const theme = themeState[themeState.selected];
    const {width,height,mode} = windowState;

    const st = {
      view:`
        position:fixed; top:0; right:0; bottom:0; left:0; margin:0; padding:0; overflow-x:hidden; overflow-y:scroll; z-index:10;
        background:linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('${themeState.wp.view}'); background-position:center; background-size:cover; background-repeat:no-repeat;
        ${menuState.current=='OPEN'?'filter:blur(5pt);':''} -webkit-overflow-scrolling:touch; background-color:${theme.view}; ${animation}
      `
    };

    const View = Unity.element('div', {style:st.view,content:`minimal-ui`}, [view(store), Modules.Footer(store)]);
    setTimeout(event=>View.scrollTo({top:viewState.scrollTop,left:0,behavior:'auto'}),50);

    let scroll_ctr = 0;
    View.addEventListener('scroll', function(event) {
      const [ current_st, event_st ] = [ viewState.scrollTop, event.target.scrollTop ];
      const diff = (event_st - current_st) < 0 ? -(event_st - current_st) : (event_st - current_st);
      if (scroll_ctr++ % 2 == 0 && diff > 5) dispatch({type:'UPDATE_VIEW_SCROLL',payload:event_st});
    },false);

    View.addEventListener('click', function(event) { if (menuState.current=='OPEN') dispatch({type:'CLOSE_MENU'}); });
    return View;
  },
  Footer: function(store) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const {footerState,windowState,mapState} = state.uiState;
    const theme = state.uiState.themeState[state.uiState.themeState.selected];
    const lg_dev = (windowState.mode == 'lg_tab' || windowState.mode == 'pc');
    const {icons,wp} = Assets.imgs;
    const E = Unity.element;

    const st = {
      footer: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; padding:0; margin:0; z-index:75; background-color:${theme.footer}; border-top:1pt solid ${theme.footer_bdr};`,
      msg: `
        display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; background-color:${theme.panel};
        margin:1em 1em 0; padding:${lg_dev?'2':'1'}em; border:solid ${theme.footer_bdr}; border-width:1pt 0; font-size:1.25em; font-weight:700; text-align:center; color:${theme.menu_txt};
        background:linear-gradient(${theme.panel},${theme.panel}), url('${wp.net}'); background-position:center; background-size:cover; background-repeat:no-repeat;
      `,
      quote_btn: `margin:1em auto 0; padding:0.5em 1em; background-color:${theme.btn}; border:1pt solid ${theme.menu_bdr}; color:${theme.menu_txt}; cursor:pointer;`,
      submenus: `margin:1em; padding:0.5em;`,
      copy: `display:flex; flex-direction:row; justify-content:space-between; align-items:center; text-align:center; border-top:1px solid ${theme.footer_bdr}; margin:0; padding:2em; font-size:1em;`,
      copy_left: `display:flex; flex-direction:row; justify-content:flex-start; align-items:flex-start; padding:0; margin:0;`,
      copy_right: `display:flex; flex-direction:row; justify-content:flex-end; align-items:flex-start; padding:0; margin:0;`,
      usa: `height:1.25em; margin:0; color:${theme.footer_txt};`,
      copy_txt: `font-size:1em; margin:0; color:${theme.footer_txt};`
    };

    const copy = E('div', {style:st.copy}, [
      E('div', {style:st.copy_left}, [E('p', {style:st.copy_txt}, [`Copyright © 2021 chivington.casa`])]),
      E('div', {style:st.copy_right}, [E('img', {src:icons.btns.usa,alt:`USA Icon`,style:st.usa}, ['United States'])])
    ]);

    return E('div', {style:st.footer}, [copy]);
  },
  Selector: function(store, selections, selected, orientation, btn_position, shadow, init_scroll) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const { windowState, uiState } = state;
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;
    const lg_dev = ((uiState.windowState.mode=='pc')||(uiState.windowState.mode=='lg_tab'))?true:false;

    const st = {
      selector: (orientation == 'LANDSCAPE'
        ? `display:flex; flex-direction:row; justify-content:center; align-items:center;`
        : `display:flex; flex-direction:column${btn_position=='top'?'':'-reverse'}; justify-content:flex-start; align-items:stretch;`)
        + `position:absolute; width:99%; height:99%; margin:0 auto; padding:0; overflow-x:hidden; overflow-y:hidden; border:1pt solid ${theme.menu_bdr}; ${shadow?'-webkit-box-shadow: 0 3pt 4pt 0 ${theme.shadow};':''}`
      ,
      displays: (orientation == 'LANDSCAPE'
        ? `display:flex; flex-direction:column; justify-content:flex-end; align-items:stretch; margin:0.5em;`
        : `display:flex; flex-direction:column; justify-content:flex-end; align-items:stretch; margin:0.5em auto;`)
        + `width:98%; height:100%; margin:0 auto; padding:0; overflow-x:hidden; overflow-y:hidden;`
      ,
      display: `width:99%; margin:0 auto; padding:0; overflow-x:hidden; overflow-y:scroll;`,
      btns: (orientation == 'LANDSCAPE'
        ? `display:flex; flex-direction:column; justify-content:flex-start; align-items:center; overflow-x:hidden; overflow-y:scroll; border-right:1pt solid ${theme.view_bdr}; width:30%; height:100%; padding:0 0.1em 0.1em 0; margin:0 auto;`
        : `display:flex; flex-direction:row; justify-content:flex-start; align-items:stretch; width:98%; overflow-x:scroll; overflow-y:hidden; border-bottom:1pt solid ${theme.view_bdr}; box-shadow:inset -20px 0 25px -5px ${theme.shadow}; padding:0.25em 0.1em 0.35em 0; margin:0 auto 0.35em;`)
      ,
      btn: (orientation == 'LANDSCAPE'
        ? `margin:0.2em 0.5em 0; width:90%;`
        : `margin:0 0.15em 0 0;`)
        + `height:1em; padding:0.4em 0.6em; background-color:${theme.btn}; border:1pt solid ${theme.btn_bdr}; color:${theme.lt_txt}; cursor:pointer; text-align:center; overflow:hidden;`
    };

    const displays = E('div', {style:st.displays}, selections.map(s => E('div', {style:`${st.display} ${s.name!=selected?'display:none;':''}`}, [s.contents])));
    window.setTimeout(n => {
      for (let i=0; i<displays.children.length; i++) displays.children[i].scrollTop = init_scroll.display == null ? displays.children[i].scrollHeight : init_scroll.display;
    }, 0);

    const btns = E('div', {style:st.btns}, selections.map(s => {
      b = E('div', {style:`${st.btn} ${s.name==selected?`border:1pt solid ${theme.lt_txt}; background-color:${theme.well}; width:${s.name.length/2}em;`:''}`}, [s.name]);
      b.addEventListener('click', (event) => dispatch({type: s.action, payload: s.payload}));
      return b;
    }));
    window.setTimeout(n => {
      if (orientation=='PORTRAIT') btns.scrollLeft = init_scroll.btns == null ? 0 : init_scroll.btns;
      else btns.scrollTop = init_scroll.btns == null ? 0 : init_scroll.btns;
    }, 0);

    return E('div', {style:st.selector}, [btns, displays]);
  },
  Portfolio: function(store, config) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const { windowState, uiState } = state;
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;
    const lg_dev = ((uiState.windowState.mode=='pc')||(uiState.windowState.mode=='lg_tab'))?true:false;
    const landscape = state.uiState.windowState.orientation == 'LANDSCAPE' ? true : false;
    const txt_color = uiState.themeState.selected=='dark' ? theme.lt_txt : theme.dk_txt;
    const { projects, bdr, bg } = config;

    const st = {
      Portfolio: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:${lg_dev?`5em 7`:`2em 2`}em; background-color:${bg?theme.panel_drk:theme.clear};`,
      project: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0; border:1px solid ${bdr?theme.view_bdr:theme.clear}; background-color:${theme.panel_lt};`,
      banner: `display:flex; flex-direction:column; justify-content:center; align-items:center; width:95%; margin:${lg_dev?2:1}em auto;`,
      banner_img: `margin:0; width:100%; border-radius:7px;`,
      title: `font-size:2em; font-weight:bold; margin:0.25em auto; text-align:center; color:${txt_color};`,
      summary: `font-size:1em; margin:0.25em ${lg_dev?'2em':''}; text-align:center; color:${txt_color};`,
      links: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0.25em auto; width:80%; border-top:0.5pt solid ${theme.view_bdr};`,
      link: `color:${theme.link}; margin: 0.25em auto; text-align:center; text-decorate:underline; overflow-wrap:anywhere; word-break:break-all;`,
      sections: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:2em 0;`,
      section: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:${landscape?'2em':0};`,
      section_title: `font-size:1.5em; font-weight:bold; margin:0.5em 0.75em 0; text-align:center; color:${txt_color}; border-bottom:1px solid ${theme.view_bdr};`,
      section_summary: `font-size:1em; margin:0.5em 1.5em; text-align:center; color:${txt_color};`,
      sub_section: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0.75em auto;`,
      content: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0;`,
      content_imgs: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0.5em auto;`,
      content_img: `width:${lg_dev?60:90}%; margin:0.5em auto;`,
      video: `height:20em;`,
      content_txt: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0 auto;`,
      content_links: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0 auto;`,
      txt: `font-size:1em; margin:0.25em auto; color:${txt_color};`
    };

    const Portfolio = E('div', {style:st.Portfolio}, projects.map(p => {
      const w = landscape?p.banner.w[0]:p.banner.w[1];
      const banner = E('div', {style:`${st.banner} width:${w}%;`}, [
        E('img', {src:p.banner.src, alt:`${p.title} Banner`, style:st.banner_img}, [])
      ]);
      const title = E('h2', {style:st.title}, [p.title]);
      const summary = E('p', {style:st.summary}, [p.summary]);

      const sections = E('div', {style:st.sections}, p.sections.map(s => {
        const section_title = E('h3', {style:st.section_title}, [s.title]);
        const section_summary = E('p', {style:st.section_summary}, [s.summary]);
        const section_media = [];
        for (i=0; i<s.content.length; i++) {
          for (j=0; j<s.content[i].media.length; j++) {
            const media_src = s.content[i].media[j];
            const media_title = media_src.split('-').join(' ');
            section_media.push({src:media_src, title:media_title});
          };
        };
        const section_slides = Modules.Slideshow(store, {media:section_media, bdr:false, bg:true, def:0});

        const section_content = E('div', {style:st.content}, s.content.map(c => {
          const txt = E('div', {style:st.content_txt}, c.txt.map(ln => E('p', {style:`${st.txt} text-align:${ln.align}; margin:0 1em 0.75em;`}, [ln.line])));
          const links = E('div', {style:st.content_links}, Object.keys(c.links).map(k =>
			E(`a`,{href:c.links[k], target:`_blank`, style:`${st.link} margin:0 1em;`}, [k.split('_').join(' ')])
		  ));
          return E('div', {style:st.sub_section}, [txt, links]);
        }));
        return E('div', {style:st.section}, [section_title, section_summary, section_slides, section_content]);
      }));

      return E('div', {style:st.project}, [banner, title, summary, sections]);
    }));

    return Portfolio;
  },
  Slideshow: function(store, config) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const { windowState, uiState } = state;
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;
    const lg_dev = ((uiState.windowState.mode=='pc')||(uiState.windowState.mode=='lg_tab'))?true:false;
    const { media, bdr, bg, def } = config;
    const { left_arrow, right_arrow } = state.uiState.imgState.icons.btns;

    const st = {
      Slideshow: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0; background-color:${bg?theme.panel_drk:theme.clear}; border:1px solid ${bdr?theme.view_bdr:theme.clear};`,
      display: `display:flex; flex-direction:row; justify-content:space-between; align-items:stretch; margin:0; width:100%; border-bottom:1px solid ${theme.view_bdr}; background-color:${theme.panel_lt};`,
      img: `margin:0 auto; max-height:${lg_dev?35:15}em; max-width:100%;`,
      btns: `display:flex; flex-direction:column; justify-content:center; align-items:center; width:${lg_dev?3:2}em; z-index:10; cursor:pointer; background-color:${theme.panel_lt};`,
      l_btn: `margin:0 -${lg_dev?5:2}em 0 0; border-right:1px solid ${theme.panel_drk};`,
      r_btn: `margin:0 0 0 -${lg_dev?5:2}em; border-left:1px solid ${theme.panel_drk};`,
      thumbs: `display:flex; flex-direction:row; justify-content:flex-start; align-items:center; margin:0; overflow-x:scroll; background-color:${theme.panel_lt};`,
      thumb: `height:7em; margin:0.1em; cursor:pointer; background-color:${theme.panel_lt}; border-right:1px solid ${theme.view_bdr};`
    };

    const media_elems = media.map(m => {
      const filetype = m.src.split('.')[1];
      if (filetype == 'mp4') return E('video', {style:st.img, controls:'controls', name:m.title, alt:`${m.title} Video`}, [E('source', {src:m.src, type:'video/mp4'}, [])]);
      else return E('img', {src:m.src, alt:`${m.title} Image`, style:st.img}, []);
    });

    let selected_img = def;
    const display = E('div', {style:st.display}, [
      E('div', {style:`${st.btns} ${st.l_btn}`}, [E('img', {src:left_arrow, alt:`Left Arrow Image`, style:'width:100%;'}, [])]),
      media_elems[selected_img],
      E('div', {style:`${st.btns} ${st.r_btn}`}, [E('img', {src:right_arrow, alt:`Right Arrow Image`, style:'width:100%;'}, [])])
    ]);

    display.firstChild.addEventListener('click', function(event) {
      selected_img = selected_img == 0 ? media_elems.length-1 : selected_img-1;
      display.replaceChild(media_elems[selected_img].cloneNode(true), display.childNodes[1]);
    });

    display.lastChild.addEventListener('click', function(event) {
      selected_img = selected_img == media_elems.length-1 ? 0 : selected_img+1;
      display.replaceChild(media_elems[selected_img].cloneNode(true), display.childNodes[1]);
    });

    const play = E('img', {src:'/imgs/thumbs/play-button.png', alt:`Video Thumbnail Image`, style:st.img}, []);
    const thumbs = E('div', {style:st.thumbs}, media_elems.map((e,i) => {
      copy = e.nodeName == 'VIDEO' ? play.cloneNode(true) : e.cloneNode(true);
      copy.style.cssText += st.thumb;
      copy.addEventListener('click', function(event) {
        selected_img = i;
        display.replaceChild(media_elems[selected_img].cloneNode(true), display.childNodes[1]);
      });
      return copy;
    }));

    return E('div', {style:st.Slideshow}, [display, thumbs]);
  },
  Tabs: function(store, config) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const { windowState, uiState } = state;
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;
    const lg_dev = ((uiState.windowState.mode=='pc')||(uiState.windowState.mode=='lg_tab'))?true:false;
    const landscape = state.uiState.windowState.orientation == 'LANDSCAPE' ? true : false;
    const { modules, bdr, lvl, bg, ht, pos, def } = config;

    const st = {
      Tabs: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0; z-index:${50*lvl}; ${ht?'max-height:40em;':''} background-color:${bg?theme.panel_drk:theme.clear}; border:1px solid ${bdr?theme.view_bdr:theme.clear};`,
      tabs: `display:flex; flex-direction:row; justify-content:${landscape?'space-around':'flex-start'}; align-items:stretch; margin:0; overflow-x:scroll; border-bottom:1pt solid ${theme.view_bdr};`,
      tab: `display:flex; flex-direction:column; justify-content:center; align-items:stretch; margin:0; width:${100/modules.length}%; cursor:pointer; background-color:${lvl%2==0?theme.btn_lt:theme.btn}; border:1pt solid ${theme.btn_bdr};`,
      selected_tab: `background-color:rgba(21,32,43,0.9);`,
      tab_title: `margin:0.5em; text-align:center; font-size:${landscape?(1/lvl*1.5):(0.65/lvl*1.65)}em; cursor:pointer; color:${theme.lt_txt};`,
      display: `margin:0 auto; width:100%; padding:0;`,
    };

    let selected_module = def;
    const display = E('div', {style:st.display}, [modules[selected_module].module]);

    const tabs = E('div', {style:st.tabs}, modules.map((m,i) => {
      const tab = E('div', {style:`${st.tab} ${i==selected_module?st.selected_tab:''}`}, [E('h2', {style:st.tab_title}, [m.title])]);
      tab.addEventListener('click', function(event) {
        tabs.childNodes[selected_module].style.cssText = st.tab;
        selected_module = i;
        tabs.childNodes[selected_module].style.cssText += st.selected_tab;
        display.replaceChild(modules[selected_module].module, display.childNodes[0]);
      });
      return tab;
    }));

    return E('div', {style:st.Tabs}, (pos=='top'?[tabs,display]:[display,tabs]));
  },
  Tiles: function(store, thumbnails, bg) {
    const [state,dispatch] = [store.getState(),store.dispatch];
    const { windowState, uiState } = state;
    const theme = uiState.themeState[uiState.themeState.selected];
    const E = Unity.element;
    const lg_dev = ((uiState.windowState.mode=='pc')||(uiState.windowState.mode=='lg_tab'))?true:false;

    const st = {
      Tiles: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0.5em; background-color:${bg?theme.panel_drk:theme.clear};`,
      thumbs: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:0.5em; border:1px solid ${theme.view_bdr}; border-radius:7px;`,
      row: `display:flex; flex-direction:${lg_dev?'row':'column'}; justify-content:${lg_dev?'space-between':'flex-start'}; align-items:${lg_dev?'baseline':'stretch'}; margin:0.5em auto; width:90%;`,
      thumb: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; width:${lg_dev?24:95}%; margin:0.5em ${lg_dev?'0.5em':'auto'}; border:1px solid ${theme.view_bdr}; border-radius:7px; cursor:pointer;`,
      thumb_img: `width:100%; height:${lg_dev?10:15}em; border-radius:7px;`,
      thumb_label: `font-size:1em; font-weight:bold; margin:0.5em; text-align:center; color:${uiState.themeState.selected=='dark' ? theme.lt_txt : theme.dk_txt};`
    };

    const rows = lg_dev ? Math.ceil((thumbnails.length)/4) : thumbnails.length;
    const cols = lg_dev ? (thumbnails.length>4 ? 4 : thumbnails.length) : 1;
    const last_row_cols = thumbnails.length % 4;
    const thumbs = [];
    for (i=0; i<rows; i++) {
      thumbs.push([]);
      const row_cols = i==rows ? last_row_cols : cols;
      for (j=0; j<row_cols; j++) {
        const idx = i*row_cols+j;
        thumbs[i].push(E('div', {style:st.thumb}, [
          E('img', {src:thumbnails[idx].src, alt:`${thumbnails[idx].label} Label`, style:st.thumb_img}, []),
          E('h2', {style:st.thumb_label}, [thumbnails[idx].label])
        ]));
        thumbs[i][j].addEventListener('click', function(event) {
          const name = thumbnails[idx].label.replace(' ', '_');
          const route = name.toUpperCase();
          dispatch({type:'NAV_TO', payload:[route, name]});
        });
      };
    };

    return E('div', {style:st.Tiles}, [E('div', {style:st.thumbs}, thumbs.map(r => E('div', {style:st.row}, r)))]);
  },
  App: function(store) {
    const [ state, dispatch ] = [ store.getState(), store.dispatch ];
    const { width, height, mode } = state.uiState.windowState;

    const st = {
      app: `position: fixed; top: 0; left: 0; height: 0%; width: 100%; margin: 0; padding: 0; z-index: 0;`
    };

    let resizeCtr = 0;
    window.addEventListener('resize', function(event) {
      if (resizeCtr++ % 5 == 0) {
        const [nw,nh] = [window.innerWidth,window.innerHeight];
        const nm = nw<600?'mb':(nw<700?'sm_tab':(nw<800?'md_tab':(nw<900?'lg_tab':'pc')))
        if (nm!=mode) dispatch({type:'RESIZE',payload:{width:nw,height:nh,mode:nm}});
      }
    });

    return Unity.element('div', {style:st.app}, [
      Modules.Header(store), Modules.Menu(store), Modules.Router(store)
    ]);
  }
};

// --------------------------------------------------------------------------------------------
//  Views - Groups Modules together to fit device.
// --------------------------------------------------------------------------------------------
const Views = {
	Home: function(store) {
		const [state,dispatch] = [store.getState(),store.dispatch];
		const {appState,userState,uiState} = state;
		const {name,phone,email,directions,employer,title,major,school,bio} = userState.infoState;
		const {windowState,mapState} = uiState;
		const landscape = state.uiState.windowState.orientation == 'LANDSCAPE' ? true : false;
		const landing = ((appState.historyState.views.slice(-1)=='@@INIT')&&(appState.historyState.actions.slice(-1)=='@@INIT'))?true:false;
		const theme = uiState.themeState[uiState.themeState.selected];
		const E = Unity.element;

		const st = {
			view: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; min-height:75%; margin:${landscape?7:6}em 0 2em;`,
			home: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; padding:0; width:100%; text-align:center; ${landing?'animation: app_fade_in 1000ms ease-in-out 1 forwards;':''}`,
			intro: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:${landscape?'5em 1em 2':'3em 1em 2'}em;`,
			name: `margin:0 auto; color:${theme.lt_txt}; font-size:3em; font-weight:400;`,
			title: `margin:0.25em; color:${theme.lt_txt}; font-size:${landscape?1.5:1.3}em; font-weight:300;`,
			actions: `display:flex; flex-direction:${landscape?'row':'column'}; justify-content:center; align-items:${landscape?'center':'stretch'}; margin:0 auto; padding:0; width:90%;`,
			btn: `margin:0.5em ${landscape?'':'auto'}; padding:0.4em 0.6em; width:${landscape?23:80}%; background-color:${theme.btn}; border:1pt solid ${theme.btn_bdr}; color:${theme.lt_txt}; cursor:pointer;`,
			bio: `margin:${landscape?2:1}em; padding:${landscape?`1`:`0.25`}em; border:1px solid ${theme.view_bdr}; background-color:${theme.well};`,
			sentence: `color:${theme.view_txt}; font-size:${landscape?1.25:1}em; font-weight:700; margin:0.5em;`,
			highlights: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:2em 0;`,
			highlight: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin:${landscape?2:1}em auto; width:${landscape?70:95}%; background-coulor:#252525; border:1pt solid ${theme.view_bdr}; cursor:pointer;`,
			highlight_img: `margin:0; width:100%; border-bottom:1pt solid ${theme.view_bdr};`,
			highlight_title: `color:${theme.lt_txt}; font-size:${landscape?1.25:0.75}em; text-align:center;`
		};

		return E('div',{style:st.view},[
			E('div', {style:st.home}, [
				E('div',{style:st.intro},[
					E('h1',{style:st.name},['chivington.casa']),
					E('h2',{style:st.title},['The personal home automation system for my dog feeder, monitoring system, and more.'])
				]),
				E('div',{style:st.actions},['DOG_FEEDER'].map((b,i,arr) => {
					const btn = E('h2', {style: st.btn}, [mapState[b].title]);
					btn.addEventListener('click', (event)=>dispatch({type:'NAV_TO', payload:b}));
					return btn;
				}))
			])
		]);
	},
	Feeder: function(store) {
		const [ state, dispatch ] = [ store.getState(), store.dispatch ];
		const { wp, thumbs } = Assets.imgs;
		const theme = state.uiState.themeState[state.uiState.themeState.selected];
		const { bio } = state.userState.infoState;
		const E = Unity.element;
		const lg_dev = ((state.uiState.windowState.mode=='pc')||(state.uiState.windowState.mode=='lg_tab'))?true:false;

		const st = {
			view: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; min-height:75%; margin:${lg_dev?7:6}em 0 0;;`,
			food_view: `margin:${lg_dev?'1em 2em':'0.5em 1em'} auto; padding:${lg_dev?1:0.25}em; background-color:${theme.panel_lt};`,
			view_title: `margin:1em; padding:0; text-align:center;`,
			cam_frame: `margin:1em auto; width:99%;`,
			stream: `margin:1em auto; width:99.8%; min-height:30em;`,
			food_frame: `margin:1em auto; width:99%; height:5.25em;`,
			txt: `margin:0 0.5em; padding:0; color:#fff;`
		};

		return E('div',{style:st.view},[
			E('div', {style:st.food_view}, [
				E('div',{style:st.view_title},[ E('h2',{style:st.txt},['Auto Doggo']) ]),
				E('div',{style:st.cam_frame},[
					E('iframe', {style:st.stream, src:'http://chivington.casa:3002', title:'Doggo Cam'}, [])
				]),
				E('iframe', {style:st.food_frame, src:'http://chivington.casa:3000/doggo', title:'Doggo Cam'}, [])
			])
		]);
	},
	About: function(store) {
		const [ state, dispatch ] = [ store.getState(), store.dispatch ];
		const { wp, thumbs } = Assets.imgs;
		const theme = state.uiState.themeState[state.uiState.themeState.selected];
		const { bio } = state.userState.infoState;
		const E = Unity.element;
		const lg_dev = ((state.uiState.windowState.mode=='pc')||(state.uiState.windowState.mode=='lg_tab'))?true:false;

		const st = {
			view: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; min-height:75%; margin:${lg_dev?7:6}em 0 3em;`,
			about_view: `margin:${lg_dev?'1em 2em':'0.5em 1em'} auto; padding:${lg_dev?1:0.25}em; background-color:${theme.well};`,
			title: `margin:${lg_dev?3:2.5}em auto 0.25em; padding:${lg_dev?0.25:0.15}em; border-bottom:1pt solid ${theme.view_bdr}; text-align:center; color:${theme.menu_txt};`,
			intro: `margin:0.5em; padding:0; text-align:center; color:${theme.view_txt};`,
			bio: `margin:1em 0 0; padding:0;`,
			section: `margin:1.5em 1em 1em; padding:0;`,
			sec_ttl: `margin:0 0 0.5em; padding:0 1em 0.5em; font-size:1em; color:${theme.view_txt}; border-bottom:1pt solid ${theme.menu_bdr};`,
			txt: `margin:0 0.5em; padding:0; color:${theme.view_txt};`,
			sentence: `margin:0.25em; color:${theme.view_txt};`,
			pdf: `width:99.5%; min-height:50em; scrollbar-width:${lg_dev?0.5:1}em;`
		};

		return E('div', {style:st.view}, [
			E('div', {style:st.about_view}, ['About App'])
		]);
	},
	Login: function(store) {
		const [ state, dispatch ] = [ store.getState(), store.dispatch ];
		const theme = state.uiState.themeState[state.uiState.themeState.selected];
		const lg_dev = ((state.uiState.windowState.mode=='pc')||(state.uiState.windowState.mode=='lg_tab'))?true:false;
		const E = Unity.element;

		const st = {
			view: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; min-height:90%;`,
			login_view: `margin:${lg_dev?'1em 2em':'0.5em 1em'} auto; padding:${lg_dev?3:1}em 0;`,
			login_panel: `width:${lg_dev?70:90}%; margin:${lg_dev?10:6}em auto 0; padding:0.5em; border:1pt solid ${theme.view_bdr}; border-radius:5pt; background-color:${theme.panel_lt};`,
			instructions: `margin:1em auto; width:${lg_dev?60:90}%; color:${theme.lt_txt}; text-align:center;`,
			credentials: `display:flex; flex-direction:row; justify-content:center; align-items:center; width:${lg_dev?90:95}%; margin:1em auto;`,
			credential: `width:45%; height:1em; margin:0.5em auto; padding:${lg_dev?'0.25em 0 0.45':'0.35em 0 0.55'}em; background-color:${theme.panel_lt}; color:${theme.lt_txt}; text-align: center; resize:none; overflow-x:hidden; overflow-y:scroll; border:1pt solid ${theme.menu_bdr};`,
			login: `margin:0.5em auto; padding:0.4em 0.6em; width:${lg_dev?50:80}%; background-color:${theme.btn}; border:1pt solid ${theme.btn_bdr}; color:${theme.lt_txt}; cursor:pointer; text-align:center;`
		};

		async function server_request(req_type, payload) {
			let response = await fetch('/', {
				method: 'POST',
				mode: 'cors',
				cache: 'no-cache',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json', 'Allow': 'GET, POST' },
				redirect: 'follow',
				referrerPolicy: 'no-referrer',
				body: JSON.stringify({type:req_type, payload:payload})
			});
			if (!response.ok) window.alert('Please try again...');
			else return await response.json();
		};

		const instructions = E('p', {style:st.instructions}, ['Login to access dog food / water controls.']);

		const credentials = E('div', {style:st.credentials}, [
			E('textarea', {style:`${st.credential} border:1pt solid ${theme.view_bdr};`, placeholder:'username'}, []),
			E('input', {style:`${st.credential} border:1pt solid ${theme.view_bdr};`, type:'password', placeholder:'password'}, [])
		]);

		for (i=0; i<credentials.children.length; i++) credentials.children[i].addEventListener('focus', (event) => event.target.value = '');
		credentials.children[1].addEventListener('keyup', (event) => {
		if (event.keyCode == 13) {
			const user = credentials.children[0].value;
			const pass = credentials.children[1].value;
			if (user=='' || pass=='') {
				crednetials.children[0].style = `${st.credential} border:1.5pt solid ${theme.error};`;
				crednetials.children[1].style = `${st.credential} border:1.5pt solid ${theme.error};`;
			} else server_request('LOGIN', {user:user, pass:pass}).then(data => {
				if (!data.status) {
					if (data[0].thread_name != 'Le Chat') {
						data.forEach(t => dispatch({type: 'BEGIN_THREAD', payload:{user:user, thread:t}}));
						dispatch({type: 'CHANGE_THREAD_SELECTION', payload: data[0].thread_name});
					}
					else window.alert('No conversations.');
					dispatch({type: 'NAV_TO', payload: state.uiState.mapState.tree[3]});
				}
				else window.alert('Login unsuccessful. Please try again.');
			});
		}});
		window.setTimeout(() => credentials.children[0].focus(), 0);

		const login = E('div', {style:st.login}, ['login']);
		login.addEventListener('click', (event) => {
		  const user = credentials.children[0].value;
		  const pass = credentials.children[1].value;
		  if (user=='' || pass=='') {
		    credentials.children[0].style = `${st.name} border:1.5pt solid ${theme.error};`;
		    credentials.children[1].style = `${st.name} border:1.5pt solid ${theme.error};`;
		  } else server_request('LOGIN', {user:user, pass:pass}).then(data => {
		    if (!data.status) {
		      if (data[0].thread_name != 'Le Chat') {
		        dispatch({type:'DELETE_THREADS', payload:''});
		        data.forEach(remote_thread => dispatch({type:'BEGIN_THREAD', payload:{user:names.children[0].value, thread:remote_thread}}));
		        dispatch({type: 'CHANGE_THREAD_SELECTION', payload: data[0].thread_name});
		      }
		      else window.alert('No conversations.');
		      dispatch({type: 'NAV_TO', payload: state.uiState.mapState.tree[3]});
		    }
		    else window.alert('Login unsuccessful. Please try again.');
		  });
		});

		return E('div', {style:st.view}, [
			E('div', {style:st.login_view}, [
				E('div', {style:st.login_panel}, [instructions, credentials, login])
			])
		]);
	},
	Settings: function(store) {
	const [ state, dispatch ] = [ store.getState(), store.dispatch ];
	const theme = state.uiState.themeState[state.uiState.themeState.selected];
	const E = Unity.element;
	const lg_dev = ((state.uiState.windowState.mode=='pc')||(state.uiState.windowState.mode=='lg_tab'))?true:false;

	const st = {
	  view: `display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; margin-top:5em; min-height:75%;`,
	  container: `width: 90%; margin:1em auto;`
	};

	return E('div', {style:st.view}, [ E('div', {style:st.container}, ['settings']) ]);
	}
};

// --------------------------------------------------------------------------------------------
//  Asset Manifest - Everything needed to cache app.
// --------------------------------------------------------------------------------------------
const Assets = {
  css:{
    fonts:{
      Avenir_Book:'/css/fonts/Avenir-Free/Avenir-Book.otf',
      Avenir_Book:'/css/fonts/Avenir-Free/Avenir-Light.otf',
      Avenir_Book:'/css/fonts/Avenir-Free/Avenir-Roman.otf'
    },
    only_css_file:'/css/only.css'
  },
  imgs:{
    icons:{
      btns:{
        close_wht:'/imgs/icons/btns/close-wht.svg',
        close_blk:'/imgs/icons/btns/close-blk.svg',
        scroll:'/imgs/icons/btns/scroll.svg',
        menu_wht:'/imgs/icons/btns/menu-wht.svg',
        menu_blk:'/imgs/icons/btns/menu-blk.svg',
        caret_wht:'/imgs/icons/btns/caret-wht.svg',
        caret_blk:'/imgs/icons/btns/caret-blk.svg',
        left_arrow:'/imgs/icons/btns/left-arrow.svg',
        right_arrow:'/imgs/icons/btns/right-arrow.svg',
		dl_blk:'/imgs/icons/sm/dl-blk.svg',
        dl_wht:'/imgs/icons/sm/dl-wht.svg',
        resume_blk:'/imgs/icons/sm/resume-blk.svg',
        resume_wht:'/imgs/icons/sm/resume-wht.svg',
        email_blk:'/imgs/icons/sm/email-blk.svg',
        email_wht:'/imgs/icons/sm/email-wht.svg',
        git_blk:'/imgs/icons/sm/git-blk.svg',
        git_wht:'/imgs/icons/sm/git-wht.svg',
        jc_pbc_blk:'/imgs/icons/sm/jc-pcb-blk.svg',
        jc_pbc_wht:'/imgs/icons/manifest/mstile-150x150.png',
        phone_blk:'/imgs/icons/sm/phone-blk.svg',
        phone_wht:'/imgs/icons/sm/phone-wht.svg',
        usa:'/imgs/icons/sm/united-states.svg',
        web_blk:'/imgs/icons/sm/web-blk.svg',
        web_wht:'/imgs/icons/sm/web-wht.svg'
      },
      manifest:{
        android_192:'/imgs/icons/manifest/android-chrome-192x192.png',
        android_512:'/imgs/icons/manifest/android-chrome-512x512.png',
        apple_touch:'/imgs/icons/manifest/apple-touch-icon.png',
        favicon_16:'/imgs/icons/manifest/favicon-16x16.png',
        favicon_32:'/imgs/icons/manifest/favicon-32x32.png',
        favicon:'/imgs/icons/manifest/android-chrome-512x512.png',
        favicon_wht:'/imgs/icons/manifest/mstile-70x70.png',
        mstile_150:'/imgs/icons/manifest/mstile-150x150.png',
        safari_pinned_tab:'/imgs/icons/manifest/safari-pinned-tab.svg'
      }
    },
    me:{
      loaf:'/imgs/me/loaf.jpg',
      win_bed:'/imgs/me/win-bed.jpg',
      win:'/imgs/me/win.jpg'
    },
    wp:{
	  mullis_rug:'/imgs/wp/mullis-rug.jpg',
      yolo:'/imgs/wp/yolo.jpg'
    },
    thumbs: {
      placeholder: '/imgs/thumbs/placeholder.jpg'
    }
  },
  js:{
    app:'/js/app.js'
  },
  browserconfig:'/browserconfig.xml',
  favicon:'/favicon.ico',
  index:'/index.html',
  license:'/LICENSE',
  webmanifest:'/site.webmanifest'
};

// --------------------------------------------------------------------------------------------
//  Blueprint - Specifies inital app state.
// --------------------------------------------------------------------------------------------
const Blueprint = {
	app:{
		about:{
			name: 'chivington.casa',
			web_app: [],
			cameras: [],
			dog_feeder: []
		},
		history:{
			actions: ['@@INIT'],
			actions_length: 5,
			views: ['@@INIT'],
			views_length: 5
		}
	},
	user:{
		name:'Johnathan Chivington',
		employer:`Eurofins Scientific`,
		title:`Chemical Analyst`,
		school:`University of West Florida`,
		major:`Physics`,
		work:{
			address:['3355 McLemore St. Pensacola, FL', 'https://www.google.com/maps/place/Eurofins+TestAmerica,+Pensacola/@30.5194576,-87.1970067,15z/data=!4m2!3m1!1s0x0:0xe44f6ffa29fadc49?sa=X&ved=2ahUKEwiU4p2n6u72AhWQSTABHZNIDf0Q_BJ6BAgpEAM-12355%2015th%20Ave%20NE%2C%20Seattle%2C%20WA%2098125!5e0!3m2!1sen!2sus!4v1585209347943!5m2!1sen!2sus'],
			email:'j.chivington@EurofinsET.com',
			phone:'850.474.1001',
			web:'https://www.eurofins.com/contact-us/worldwide-interactive-map/usa/eurofins-testamerica-pensacola/'
		},
		personal:{
			address:['3207 Torres Ave. Pensacola, FL', 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d54985.777402073196!2d-87.2882108!3d30.5320345!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8890eae222f45a3f%3A0x8efd15bc940ebc5e!2sWoodSpring%20Suites%20Pensacola%20Northeast!5e0!3m2!1sen!2sus!4v1648678291641!5m2!1sen!2sus'],
			email:'j.chivington@ieee.com',
			phone:'360.660.7499',
			web: `https://chivington.casa`,
			github:'https://github.com/chivington'
		},
		notifications: {
			permission: false
		}
	},
	ui:{
		map:{
			'HOME': {view:Views.Home, title:'Home', icon:Assets.imgs.me.win},
			'ABOUT': {view:Views.About, title:'About', icon:Assets.imgs.me.win},
			'DOG_FEEDER': {view:Views.Feeder, title:'Dog Feeder', icon:Assets.imgs.me.win},
			'DOG_CAM': {view:Views.Cameras, title:'Doggo Vision', icon:Assets.imgs.me.win},
			'LOGIN': {view:Views.Login, title:'Login', icon:Assets.imgs.me.win},
			'SETTINGS': {view:Views.Settings, title:'Settings', icon:Assets.imgs.me.win},
			'STAGING': {view:Views.Staging, title:'Staging', icon:Assets.imgs.me.win},
			'DEFAULT': {view:Views.Home, title:'Home', icon:Assets.imgs.me.win}
		},
		theme:{
			selected: 'dark',
			dark:{
				header: `rgba(19,19,19,1)`,
				header_txt: `rgba(255,255,255,1)`,
				header_bdr: `rgba(255,255,255,0.6)`,
				menu: `rgba(21,32,43,0.9)`,
				menu_bdr: `rgba(255,255,255,0.9)`,
				menu_btn: `rgba(21,32,43,0.9)`,
				menu_sub: `rgba(70,87,117,0.5)`,
				menu_txt: `rgba(255,255,255,1)`,
				view: `rgba(70,77,97,0.9)`,
				view_bdr: `rgba(255,255,255,0.9)`,
				view_txt: `rgba(255,255,255,1)`,
				lt_txt: `rgba(255,255,255,1)`,
				dk_txt: `rgba(25,25,25,1)`,
				well: `rgba(70,87,117,0.9)`,
				panel_lt: `rgba(61,61,61,0.5)`,
				panel: `rgba(33,33,33,0.7)`,
				panel_drk: `rgba(11,11,11,0.7)`,
				btn: `rgba(53,92,146,1)`,
				btn_lt: `rgba(70,77,97,1)`,
				btn_bdr: `rgba(70,122,194,0.9)`,
				footer: `rgba(33,33,33,0.9)`,
				footer_bdr: `rgba(70,122,194,0.9)`,
				footer_txt: `rgba(255,255,255,1)`,
				shadow: `rgba(50,50,50,0.9)`,
				success: '#4e4',
				link: '#09f',
				error: '#e44',
				clear: `rgba(0,0,0,0)`
			},
			light:{
				header: `rgba(255,255,255,1)`,
				header_txt: `rgba(55,55,75,0.9)`,
				header_bdr: `rgba(25,25,25,1)`,
				menu: `rgba(112,140,188,0.9)`,
				menu_bdr: `rgba(35,45,75,0.9)`,
				menu_btn: `rgba(66,103,178,1)`,
				menu_sub: `rgba(120,160,195,1)`,
				menu_txt: `rgba(255,255,255,1)`,
				view: `rgba(255,255,255,1)`,
				view_bdr: `rgba(75,75,75,0.9)`,
				view_txt: `rgba(55,55,75,0.9)`,
				lt_txt: `rgba(255,255,255,1)`,
				dk_txt: `rgba(25,25,25,1)`,
				well: `rgba(255,255,255,1)`,
				panel_lt: `rgba(112,140,200,0.3)`,
				panel: `rgba(112,140,188,0.5)`,
				panel_drk: `rgba(50,50,75,0.7)`,
				btn: `rgba(81,128,193,1)`,
				btn_lt: `rgba(105,155,225,1)`,
				btn_bdr: `rgba(25,25,25,0.9)`,
				footer: `rgba(255,255,255,1)`,
				footer_bdr: `rgba(25,25,25,0.9)`,
				footer_btn: `rgba(70,87,117,0.4)`,
				footer_txt: `rgba(55,55,75,0.9)`,
				shadow: `rgba(50,50,75,0.7)`,
				success: '#4e4',
				error: '#e44',
				link: '#09f',
				clear: `rgba(0,0,0,0)`
			},
			wp:{view:Assets.imgs.wp.mullis_rug}
		},
		window:{
			width: window.innerWidth,
			height: window.innerHeight,
			mode: window.innerWidth<600?'mb':(window.innerWidth<700?'sm_tab':(window.innerWidth<800?'md_tab':(window.innerWidth<900?'lg_tab':'pc'))),
			orientation: window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT'
		},
		header:{
			icon: Assets.imgs.icons.manifest.favicon,
			alt: 'chivington.casa Icon',
			menu_btn: Assets.imgs.icons.btns.menu
		},
		menu:{
			current: 'CLOSED',
			previous: 'CLOSED',
			scrollTop: 0
		},
		view:{
			current: 'HOME',
			previous: '@@INIT',
			scrollTop: 0
		},
		imgs: Assets.imgs
	}
};

// --------------------------------------------------------------------------------------------
//  Reducers - Functions that initialize state & reduce it on each state change.
// --------------------------------------------------------------------------------------------
const Reducers = {
	appState: function(state=Blueprint.app, action) {
		return Unity.combine({
			aboutState: Unity.reducer(Blueprint.app.about, {}),
			historyState: Unity.reducer(Blueprint.app.history, {
				'NAV_TO': (s,a) => ({
					actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type],
					views: s.views.length == Blueprint.app.history.views_length ? [...s.views.slice(1), a.payload] : [...s.views, a.payload]
				}),
				'TOGGLE_MENU': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'OPEN_MENU': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'CLOSE_MENU': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'CHANGE_THEME': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'RESIZE': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'BEGIN_THREAD': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'TYPING': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'UPDATE_THREAD': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'REFRESH_THREADS': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'DELETE_THREAD': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views}),
				'DELETE_THREADS': (s,a) => ({actions: s.actions.length == Blueprint.app.history.actions_length ? [...s.actions.slice(1), a.type] : [...s.actions, a.type], views: s.views})
			})
		})(state, action);
	},
	userState: function(state=Blueprint.user, action) {
		return Unity.combine({
			infoState: Unity.reducer(Blueprint.user, {})
		})(state, action);
	},
	uiState: function (state=Blueprint.ui, action) {
		return Unity.combine({
			mapState: Unity.reducer(Blueprint.ui.map, {}),
			menuState: Unity.reducer(Blueprint.ui.menu, {
				'UPDATE_MENU_SCROLL': (s,a) => ({current: s.current, previous: s.previous, scrollTop: a.payload}),
				'NAV_TO': (s,a) => ({current: 'CLOSED', previous: s.current, scrollTop: 0}),
				'TOGGLE_MENU': (s,a) => ({current: s.current == 'OPEN' ? 'CLOSED' : 'OPEN', previous: s.current, scrollTop: 0}),
				'OPEN_MENU': (s,a) => ({current: 'OPEN', previous: s.current, scrollTop: 0}),
				'CLOSE_MENU': (s,a) => ({current: 'CLOSED', previous: s.current, scrollTop: 0}),
				'TOGGLE_THEME': (s,a) => ({current: 'OPEN', previous: s.current, scrollTop: a.payload})
			}),
			themeState: Unity.reducer(Blueprint.ui.theme, {
				'TOGGLE_THEME': (s,a) => Object.assign({}, s, {selected: s.selected == 'dark' ? 'light' : 'dark'}),
				'TOGGLE_WP': (s,a) => Object.assign({}, s, Object.assign({}, s.wp, a.payload))
			}),
			viewState: Unity.reducer(Blueprint.ui.view, {
				'NAV_TO': (s,a) => ({current: a.payload, previous: s.current, scrollTop: 0}),
				'UPDATE_VIEW_SCROLL': (s,a) => ({current: s.current, previous: s.previous, scrollTop: a.payload})
			}),
			windowState: Unity.reducer(Blueprint.ui.window, {
				'RESIZE': (s,a) => a.payload
			}),
			imgState: Unity.reducer(Blueprint.ui.imgs, {})
		})(state, action);
	}
};

// --------------------------------------------------------------------------------------------
//  Middlewares - Functions that intercept state changes.
// --------------------------------------------------------------------------------------------
const Middlewares = {
	// logActions: Unity.middlewares.logActions('@@INIT'),
	listenerBypass: Unity.middlewares.listenerBypass({
		'UPDATE_VIEW_SCROLL': ['Render_App'],
		'UPDATE_MENU_SCROLL': ['Render_App']
	})
};

// --------------------------------------------------------------------------------------------
//  Initialization - Initialize application with Blueprint & Asset Manifest.
// --------------------------------------------------------------------------------------------
const App_Root = document.getElementById('App_Root');
const Load_Screen_Root = document.getElementById('Load_Screen_Root');
Unity.initialize(App_Root,Load_Screen_Root,Blueprint,Reducers,Middlewares);
