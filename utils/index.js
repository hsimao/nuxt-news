import Cookie from "js-cookie";

// 將firebase回傳的資料解構, 並儲存到localStorage、Cookie
export const saveUserData = ({ idToken, expiresIn }, { email, avatar }) => {
  const tokenExpriation = Date.now() + expiresIn * 1000;
  localStorage.setItem("jwt", idToken);
  localStorage.setItem("expiresIn", tokenExpriation);
  localStorage.setItem("user", email);
  localStorage.setItem("avatar", avatar);
  Cookie.set("jwt", idToken);
  Cookie.set("expiresIn", tokenExpriation);
  Cookie.set("user", email);
  Cookie.set("avatar", avatar);
};

// 解析cookie並取出
export const getUserFromCookie = req => {
  if (!req.headers.cookie) return;

  const jwtCookie = req.headers.cookie
    .split(";")
    .find(c => c.trim().startsWith("jwt="));
  const expiresInCookie = req.headers.cookie
    .split(";")
    .find(c => c.trim().startsWith("expiresIn="));
  const userCookie = req.headers.cookie
    .split(";")
    .find(c => c.trim().startsWith("user="));
  const avatarCookie = req.headers.cookie
    .split(";")
    .find(c => c.trim().startsWith("avatar="));

  // 若缺少其中一項cookie資訊就返回
  if (!jwtCookie || !expiresInCookie || !userCookie || !avatarCookie) return;

  const jwt = jwtCookie.split("=")[1];
  const expiresIn = expiresInCookie.split("=")[1];
  const user = userCookie.split("=")[1];
  const avatar = avatarCookie.split("=")[1];

  return { jwt, expiresIn, user, avatar };
};

export const getUserFromLocalStorage = () => {
  // 如果瀏覽器有支援localStorage
  if (localStorage) {
    const jwt = localStorage.getItem("jwt");
    const expiresIn = localStorage.getItem("expiresIn");
    const user = localStorage.getItem("user");
    const avatar = localStorage.getItem("avatar");
    return { jwt, expiresIn, user, avatar };
  }
};

/**
 * 清空user localStorage、cookie資訊
 * 用戶端才需要清空localStorage
 * 伺服器端、用戶端皆須清空cookie
 */
export const clearUserData = () => {
  if (!process.server) {
    localStorage.removeItem("jwt");
    localStorage.removeItem("expiresIn");
    localStorage.removeItem("user");
    localStorage.removeItem("avatar");
  }
  Cookie.remove("jwt");
  Cookie.remove("expiresIn");
  Cookie.remove("user");
  Cookie.remove("avatar");
};
