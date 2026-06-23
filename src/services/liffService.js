import { CONFIG } from "../config/config";

export async function initLiffProfile() {
  // LIFF ID未設定ならローカル確認用のモックユーザーで動かす
  if (!CONFIG.LIFF_ID) {
    return {
      userId: "mock-user",
      displayName: "テストユーザー",
      isMock: true,
    };
  }

  if (typeof liff === "undefined") {
    throw new Error("LIFF SDKが読み込まれていません");
  }

  await liff.init({
    liffId: CONFIG.LIFF_ID,
  });

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const profile = await liff.getProfile();

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    isMock: false,
  };
}