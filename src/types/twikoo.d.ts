declare module "twikoo/dist/twikoo.nocss.js" {
  interface TwikooInitOptions {
    el: HTMLElement | string;
    envId: string;
    path?: string;
    lang?: "zh-CN" | "en";
    region?: "ap-shanghai" | "ap-guangzhou";
  }

  const twikoo: {
    init(options: TwikooInitOptions): Promise<void>;
  };

  export default twikoo;
}
