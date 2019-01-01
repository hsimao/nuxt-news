import Vuex from "vuex";
import md5 from "md5";
import db from "~/plugins/firestore";
import slugify from "slugify";
import { saveUserData, clearUserData } from "~/utils";
import defaultImage from "~/assets/default-image.jpeg";

const store = () => {
  return new Vuex.Store({
    state: {
      loading: false,
      headlines: [],
      news: null,
      likes: [],
      category: "",
      country: "tw",
      source: null,
      token: "",
      user: null
    },
    mutations: {
      setLoading(state, loading) {
        state.loading = loading;
      },
      setHeadlines(state, headlines) {
        state.headlines = headlines;
      },
      setNews(state, news) {
        state.news = news;
      },
      setLikes(state, likes) {
        state.likes = likes;
      },
      setCategory(state, category) {
        state.category = category;
      },
      setCountry(state, country) {
        state.country = country;
      },
      setSource(state, source) {
        state.source = source;
      },
      setToken(state, token) {
        state.token = token;
      },
      setUser(state, user) {
        state.user = user;
      },
      clearToken: state => (state.token = ""),
      clearUser: state => (state.user = null),
      clearLikes: state => (state.likes = [])
    },
    actions: {
      async loadHeadlines({ commit }, apiUrl) {
        commit("setLoading", true);
        const { articles } = await this.$axios.$get(apiUrl);

        // 將取回的新聞資料標題重新格式化(刪除特殊符號，全小寫)，在使用md5轉換,來提供給自行產生的新聞內頁當路由id用
        const newNews = articles.map(article => {
          let newsId = slugify(article.url, {
            replacement: "-", // 將空格用'-'符號替代
            remove: /[^a-zA-Z0-9 -]/g, // 將特殊符號刪除
            lower: true // 全部改為小寫
          });
          if (!article.urlToImage) {
            article.urlToImage = defaultImage;
          }
          newsId = md5(newsId);
          const news = { ...article, newsId };
          return news;
        });
        commit("setLoading", false);
        commit("setHeadlines", newNews);
      },
      // 新增收藏新聞
      async addNewsToUser({ state, commit }, news) {
        // 在user底下新增一個likes資料表，並使用新聞標題當作key
        const likesRef = db
          .collection(`users/${state.user.email}/likes`)
          .doc(news.title);
        await likesRef.set(news).then(() => {
          // 更新 store likes
          let newLikes = [...state.likes, news];
          commit("setLikes", newLikes);
        });
      },
      // 刪除收藏新聞
      async deleteLikes({ state, commit }, news) {
        const likesRef = db
          .collection(`users/${state.user.email}/likes`)
          .doc(news.title);

        await likesRef.delete().then(() => {
          // 資料庫刪除成功後, 同步刪除store上的此篇新聞
          let newLikes = [...state.likes];
          const deleteIndex = newLikes.findIndex(
            item => item.title === news.title
          );
          newLikes.splice(deleteIndex, 1);
          commit("setLikes", newLikes);
        });
      },
      async loadUserLikes({ state, commit }) {
        if (state.user) {
          const likesRef = db.collection(`users/${state.user.email}/likes`);
          await likesRef.get().then(newsArray => {
            let likes = [];
            newsArray.forEach(news => {
              likes.push(news.data());
            });
            commit("setLikes", likes);
          });
        }
      },
      /**
       * [saveNews 新增新聞]
       * 核對id檢查該篇文章是否已經在資料庫，有就將newsId賜值
       * 資料庫尚未有該篇新聞, 將該篇文章儲存
       */
      async saveNews(context, news) {
        console.log("hihi", news);
        const newsRef = db.collection("news").doc(news.newsId);
        let newsId;
        await newsRef.get().then(doc => {
          if (doc.exists) {
            newsId = doc.id;
          }
        });
        if (!newsId) {
          await newsRef.set(news);
        }
      },
      /**
       * [loadNews 載入當前頁面新聞]
       * 載入前須判斷該則新聞是否有留言comment
       * 如果有則需另外合併後回傳
       */
      async loadNews({ commit }, newsId) {
        const newsRef = db.collection("news").doc(newsId);
        const commentsRef = db
          .collection(`news/${newsId}/comments`)
          .orderBy("publishedAt", "desc");

        let loadNews = {};
        await newsRef.get().then(async doc => {
          if (doc.exists) {
            loadNews = doc.data();

            // 判斷是否有留言，有則將留言合併後回傳，否則直接回傳news資料
            await commentsRef.get().then(comments => {
              if (comments.empty) {
                commit("setNews", loadNews);
              } else {
                let loadComments = [];
                comments.forEach(doc => {
                  loadComments.push(doc.data());
                });
                loadNews["comments"] = loadComments;
                commit("setNews", loadNews);
              }
            });
          }
        });
      },
      /**
       * [sendComment 新增留言]
       * 將留言新增在資料庫news該篇新聞底下(comments)
       * 新增完後將所有留言重新抓出，並重新更新當前news資料到vuex
       */
      async sendComment({ state, commit }, comment) {
        const commentsRef = db.collection(`news/${state.news.newsId}/comments`);
        commit("setLoading", true);
        await commentsRef.doc(comment.id).set(comment);
        await commentsRef
          .orderBy("publishedAt", "desc")
          .get()
          .then(val => {
            let comments = [];
            val.forEach(doc => {
              comments.push(doc.data());
              // 更新當前vuex中的news資料,用新的comments覆蓋過去
              const updateNews = { ...state.news, comments };
              commit("setNews", updateNews);
            });
          });
        commit("setLoading", false);
      },
      /**
       * [likeComment 留言likes]
       * 判斷該則留言是否已經有被點過讚, 尚未就直接新增紀錄
       * 若已經有人點過讚則需檢查是否已經點過讚
       */
      async likeComment({ state, commit }, commentId) {
        const commentsRef = db
          .collection(`news/${state.news.newsId}/comments`)
          .orderBy("publishedAt", "desc");
        const likedCommentRef = db
          .collection("news")
          .doc(state.news.newsId)
          .collection("comments")
          .doc(commentId);

        await likedCommentRef.get().then(doc => {
          if (doc.exists) {
            // 如果已經有likes紀錄，需檢查核對身份
            let newLikes = [...doc.data().likes];
            if (!newLikes) {
              // 該則留言尚未點過讚，直接新增
              newLikes.push(state.user.email);
            } else {
              // 已經有讚需檢查user，已存在就刪除，未找到就新增
              const likesIndex = doc
                .data()
                .likes.findIndex(item => item === state.user.email);
              if (likesIndex > -1) {
                newLikes.splice(likesIndex, 1);
              } else {
                newLikes.push(state.user.email);
              }
            }
            likedCommentRef.update({
              likes: newLikes
            });
          }
        });

        // 更新當前新聞的評論到vuex
        await commentsRef.get().then(doc => {
          let loadedComments = [];
          doc.forEach(comment => loadedComments.push(comment.data()));
          const updatedNews = {
            ...state.news,
            comments: loadedComments
          };
          commit("setNews", updatedNews);
        });
      },
      /**
       * [authUser 註冊/登入]
       * 接收傳來的資訊，利用action判斷是註冊還是登入,
       * 發送對應的api址以及資料處理方式,
       * 註冊或登入成功將firebase回傳的Token、user資料儲存到vuex
       * 同步將資料儲存到localStorage、Cookie
       */
      async authUser({ commit }, userData) {
        try {
          commit("setLoading", true);
          // firebase註冊api, 使用傳來的action判斷要調用註冊或登入api
          const authUserData = await this.$axios.$post(`/${userData.action}/`, {
            email: userData.email,
            password: userData.password,
            returnSecureToken: userData.returnSecureToken
          });

          let user;
          if (userData.action === "register") {
            // 自動產生頭像超連結
            const avatar = `http://gravatar.com/avatar/${md5(
              authUserData.email
            )}?d=identicon`;
            user = {
              email: authUserData.email,
              avatar
            };
            // 儲存user資料到firestore
            await db
              .collection("users")
              .doc(user.email) // 索引id
              .set(user);
          } else {
            // 從firestore取出user資料
            const loginRef = db.collection("users").doc(userData.email);
            const loggedInUser = await loginRef.get();
            user = loggedInUser.data();
          }

          commit("setUser", user);
          commit("setToken", authUserData.idToken);
          commit("setLoading", false);
          saveUserData(authUserData, user);
        } catch (err) {
          console.error(err);
          commit("setLoading", false);
        }
      },
      setLogoutTimer({ dispatch }, time) {
        setTimeout(() => {
          dispatch("logoutUser");
        }, time);
      },
      logoutUser({ commit }) {
        // 清空vuex資料
        commit("clearToken");
        commit("clearUser");
        commit("clearLikes");
        // 清空cookie, localStorage資料
        clearUserData();
      }
    },
    getters: {
      loading: state => state.loading,
      headlines: state => state.headlines,
      news: state => state.news,
      likes: state => state.likes,
      category: state => state.category,
      country: state => state.country,
      source: state => state.source,
      auth: state => !!state.token,
      user: state => state.user
    }
  });
};

export default store;
