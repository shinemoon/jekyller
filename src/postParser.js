function postParse(c){
  var mt;
  //get the yaml matters
  var patt = /(---[\s\S]*?)---([\s\S]*)/;
  var res = c.match(patt);
  mt = YAML.parse(res[1]);
  mt['content'] = res[2];
  return mt;
}
