// redis 配置。 redis 使用参见 http://devdocs.io/redis/
import env from "~/src/configs/env";

// 开发环境配置
const development = {
  host: "47.94.17.183",
  port: "6379",
  password: "123456",
};
// 测试环境配置
const testing = development;

// 线上环境配置
const production = testing;

let config = {
  development,
  testing,
  production,
};

export default config[env];
