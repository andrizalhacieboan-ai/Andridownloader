import * as cheerio from "cheerio";

class Yt5sFB {
  constructor() {
    this.baseUrl = "https://yt5s.io";
    this.headers = {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "origin": this.baseUrl,
      "referer": `${this.baseUrl}/en20/facebook-downloader`,
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      "x-requested-with": "XMLHttpRequest"
    };
  }

  async getData(url) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const headers = {
        ...this.headers,
        "cookie": `.AspNetCore.Culture=c%3Den%7Cuic%3Den; _ga=GA1.1.2011585369.${timestamp}; _ga_P5PP4YVN0Y=GS1.1.${timestamp}.4.1.${timestamp}.0.0.0`
      };

      const body = new URLSearchParams({
        q: url,
        vt: "facebook"
      }).toString();

      const response = await fetch(`${this.baseUrl}/api/ajaxSearch/facebook`, {
        method: "POST",
        headers,
        body
      });

      const json = await response.json();
      return json?.data || null;
    } catch (error) {
      throw error;
    }
  }

  parseData(html) {
    try {
      if (!html) return null;
      const $ = cheerio.load(html);
      const img = $("div.image-fb img").attr("src") || "";
      const title = $("h3").text().trim() || "";
      const duration = $("p").eq(0).text().trim() || "";
      const links = $("a.download-link-fb").get().map(el => {
        const em = $(el);
        return {
          quality: em.closest("tr").find(".video-quality").text().trim() || "",
          url: em.attr("href") || ""
        };
      }).filter(v => v.url);

      return {
        img,
        title,
        duration,
        links
      };
    } catch (error) {
      return null;
    }
  }

  async download({ url }) {
    if (!url) throw new Error("URL parameter is required");
    const htmlData = await this.getData(url);
    if (!htmlData) throw new Error("Failed to retrieve HTML response from target server");
    return this.parseData(htmlData);
  }
}

export { Yt5sFB };
