/*
iApi的java客户端
 */

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.URL;
import java.net.URLConnection;

class JApi{

  public static final String md5(String context){
    try {
        MessageDigest md = MessageDigest.getInstance("MD5");
        md.update(context.getBytes());//update处理
        byte [] encryContext = md.digest();//调用该方法完成计算

        int i;
        StringBuilder buf = new StringBuilder();
        for (int offset = 0; offset < encryContext.length; offset++) {//做相应的转化（十六进制）
            i = encryContext[offset];
            if (i < 0) i += 256;
            if (i < 16) buf.append("0");
            buf.append(Integer.toHexString(i));
       }
       // System.out.println("32result: " + buf.toString());// 32位的加密
       // System.out.println("16result: " + buf.toString().substring(8, 24));// 16位的加密
       return buf.toString();
    } catch (NoSuchAlgorithmException e) {
        e.printStackTrace();
    }
    return null;
  }


  public static final String httpPost(String reqUrl, String reqData){
    PrintWriter out = null;
    BufferedReader in = null;
    StringBuilder result = new StringBuilder();
    try {
        URL realUrl = new URL(reqUrl);
        URLConnection conn = realUrl.openConnection();
        conn.setRequestProperty("Content-Type", "application/json");
//            conn.setRequestProperty("connection", "Keep-Alive");
//            conn.setRequestProperty("user-agent","Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1;SV1)");
        conn.setDoOutput(true);
        conn.setDoInput(true);
        out = new PrintWriter(conn.getOutputStream());
        out.print(reqData);
        out.flush();
        in = new BufferedReader( new InputStreamReader(conn.getInputStream()));
        String line;
        while ((line = in.readLine()) != null) {
            result.append(line);
        }
    } catch (Exception e) {
        e.printStackTrace();
    } finally{
        try{
            if(out!=null){
                out.close();
            }
            if(in!=null){
                in.close();
            }
        }
        catch(IOException ex){
            ex.printStackTrace();
        }
    }
    return result.toString();
  }

  @SuppressWarnings("unchecked")
  private static final void jsonToList(HashMap<String,Object> jSONObject,ArrayList<String> arrayList){
    Iterator<String> keys = jSONObject.keySet().iterator();
    while (keys.hasNext()) {
        String itemKey = keys.next();
        if ("sign".equals(itemKey)) {
          continue;
        }else if("req".equals(itemKey)){
          jsonToList((HashMap<String,Object>)jSONObject.get("req"),arrayList);
          continue;
        }
        String itemVal = String.valueOf(jSONObject.get(itemKey));
        arrayList.add(new StringBuilder(itemKey).append("=").append(itemVal).toString());
    }
  }

  private final static String sign(HashMap<String,Object> jSONObject,String signKey) {
    ArrayList<String> arrayList = new ArrayList<String>();
    jsonToList(jSONObject,arrayList);
    Collections.sort(arrayList);
    StringBuilder sb = new StringBuilder();
    for (String itemPair : arrayList) {
        sb.append(new StringBuilder("&").append(itemPair));
    }
    sb.append("&key=").append(signKey);
    sb.deleteCharAt(0);
    String signSrc = sb.toString();
    // System.out.println("signSrc:"+signSrc);
    return md5(signSrc);
  }

  @SuppressWarnings("unchecked")
  public final static String mapToStr(HashMap<String,Object> reqData){
    StringBuilder sb = new StringBuilder();
    Iterator<String> keys = reqData.keySet().iterator();
    while (keys.hasNext()) {
      String itemKey = keys.next();
      sb.append(",\"").append(itemKey).append("\":");
      Object itemVal = reqData.get(itemKey);
      if (itemVal instanceof Number) {
        sb.append(itemVal);
      }else if(itemVal instanceof HashMap){
        sb.append(mapToStr((HashMap<String,Object>)itemVal));
      }else{
        sb.append("\"").append(String.valueOf(itemVal)).append("\"");
      }
    }
    sb.deleteCharAt(0);
    sb.insert(0,"{").append("}");
    return sb.toString();
  }


  public static final String sendReq(String reqUrl,HashMap<String,Object> reqData,String signKey){
    HashMap<String,Object> jSONObject = new HashMap<String,Object>();
    jSONObject.put("t", System.currentTimeMillis());
    jSONObject.put("req", reqData);
    jSONObject.put("s", sign(jSONObject,signKey));
    String reqStr = mapToStr(jSONObject);
    // System.out.println("reqStr:"+reqStr);
    return httpPost(reqUrl,reqStr);
  }

  public static void main(String[] args) {


    HashMap<String,Object> reqData = new HashMap<String,Object>();
    reqData.put("user_id", "340421190710145412");
    reqData.put("user_name", "张三");
    reqData.put("c_key", "test_c_key");
    String re = sendReq("http://localhost:15006/fangcm/checkCNId",reqData,"testKey");
    System.out.println("re:["+re+"]");

  }
}