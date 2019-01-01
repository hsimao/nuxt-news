const pkg = require("./package");

module.exports = {
  mode: "spa",
  // 在每頁渲染前運行，調用中間件check-auth檢查
  router: {
    middleware: "check-auth"
  },

  /*
   ** Headers of the page
   */
  head: {
    title: pkg.name,
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: pkg.description }
    ],
    link: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      // 引入 vue-material icon
      {
        rel: "stylesheet",
        href:
          "//fonts.googleapis.com/css?family=Roboto:400,500,700,400italic|Material+Icons"
      }
    ]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: { color: "#5770f6", height: "6px" },

  /*
   ** Global CSS
   */
  css: [
    // 引入 vue-material css
    { src: "vue-material/dist/vue-material.min.css", lang: "css" },
    // 將自定義的顏色引入
    { src: "~/assets/theme.scss", lang: "scss" }
  ],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    // 引入 vue-material
    { src: "~/plugins/vue-material" },
    { src: "~/plugins/axios" },
    { src: "~/plugins/firestore" },
    { src: "~/plugins/time-filters" }
  ],

  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    "@nuxtjs/axios",
    "@nuxtjs/proxy"
  ],
  /*
   ** Axios module configuration
   */
  axios: {
    credentials: true,
    proxy: true
  },
  proxy: {
    // 將/api/ 網址替換成 https://newsapi.org/v2/
    "/api/": {
      target: "https://newsapi.org/v2/",
      pathRewrite: { "^/api/": "" }
    },
    // 信箱密碼[註冊]api網址
    "/register/": {
      target:
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=[key]",
      pathRewrite: { "^/register/": "" }
    },
    // 信箱密碼[登入]api網址
    "/login/": {
      target:
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=[key]",
      pathRewrite: { "^/login/": "" }
    }
  },

  /**
   * env 環境變數設置
   */
  env: {
    NEWS_API_KEY: "[key]"
  },

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {}
  }
};
