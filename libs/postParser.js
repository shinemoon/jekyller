function postParse(c){
  var mt;
  //get the yaml matters
  var patt = /(---[\s\S]*?)---([\s\S]*)/;
  var res = c.match(patt);
  mt = YAML.parse(res[1]);
  // 去除内容首尾的空白字符，避免每次加载都增加空行
  mt['content'] = res[2].trim();
  return mt;
}
