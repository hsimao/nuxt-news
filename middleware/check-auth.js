import { getUserFromCookie, getUserFromLocalStorage } from "~/utils";

export default function({ store, req }) {
  // 如果在伺服器端，但沒接收到任何request資訊就返回
  if (process.server && !req) return;

  // 伺服器端：使用cookie獲取資訊
  // 用戶端：使用localStorage獲取資訊
  const userData = process.server
    ? getUserFromCookie(req)
    : getUserFromLocalStorage();

  if (!userData) {
    return;

    // 沒有token或保存時間已經過期就將資料清空
  } else if (!userData.jwt || Date.now() > userData.expiresIn) {
    store.dispatch("logoutUser");

    // 設置user資料跟啟用登出timer
  } else {
    store.commit("setToken", userData.jwt);
    store.commit("setUser", { email: userData.user, avatar: userData.avatar });
    // 登出時間
    const timeToLogout = userData.expiresIn - Date.now();
    store.dispatch("setLogoutTimer", timeToLogout);
  }
}
