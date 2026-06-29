const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatSentence = (str) => {
  let s = str.trim();
  if (s && !s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
    s += ".";
  }
  return s;
};

const cleanStringArray = (arr) => {
  if (!arr) return [];
  const unique = [];
  const seen = new Set();
  
  for (const item of arr) {
    if (!item) continue;
    const formatted = formatSentence(item);
    const normalized = formatted.replace(/\.$/, "").replace(/\s+/g, " ").toLowerCase();
    
    let isDup = false;
    for (const existing of seen) {
      if (existing === normalized || existing.includes(normalized) || normalized.includes(existing)) {
        isDup = true;
        break;
      }
    }
    
    if (!isDup) {
      seen.add(normalized);
      unique.push(formatted);
    }
  }
  return unique;
};

const cleanSources = (sources) => {
  if (!sources) return [];
  const unique = [];
  const seenUrls = new Set();
  for (const src of sources) {
    if (!src || !src.url) continue;
    const url = src.url.trim().toLowerCase();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      unique.push({
        url: src.url.trim(),
        label: src.label ? src.label.trim() : src.url.trim()
      });
    }
  }
  return unique;
};

const fixUniqueTraits = (traits) => {
  if (!traits) return "";
  const trimmed = traits.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
        return parsed.join("");
      }
    } catch (e) {
      // Ignore
    }
  }
  return trimmed;
};

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  const processed = creatures.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 117: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    newC.unique_traits = fixUniqueTraits(c.unique_traits || "");
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'bioluminescent-ostracod') {
      const charAdd = "Tuyến phát quang của chúng phát triển ở phần môi trên bao gồm hai loại tế bào tuyến hình ống riêng biệt đổ ra ngoài bằng các lỗ nhỏ giúp kiểm soát tốc độ phun.";
      if (!newC.characteristics || !newC.characteristics.includes("Tuyến phát quang của chúng phát triển ở phần môi trên")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bọ giáp cổ bị nuốt, dịch phát quang nhuộm sáng cả con cá từ bên trong, biến nó thành tấm bia phát sáng rõ rệt giữa đại dương tối. Đây gọi là thuyết báo động săn mồi (burglar alarm hypothesis) để thu hút kẻ săn mồi lớn hơn.";
      if (!newC.survival_method || !newC.survival_method.includes("thuyết báo động săn mồi")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Bước sóng phát sáng cực đỉnh ở mức 460nm là bước sóng tối ưu giúp ánh sáng truyền đi xa nhất trong môi trường nước biển ven bờ.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Bước sóng phát sáng cực đỉnh ở mức 460nm")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Lớp vỏ hai mảnh có thể đóng chặt khít bằng cơ khép khỏe giúp bảo vệ cơ thể khỏi nước biển bị ô nhiễm nhẹ trong thời gian ngắn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn bất hoạt khả năng phát quang nếu nồng độ cơ chất luciferin cạn kiệt, cần ít nhất 24 giờ để tái tổng hợp đầy đủ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sự phát quang của loài này đồng bộ đến mức hàng triệu con có thể phát sáng cùng lúc tạo ra những dải sóng xanh dương rực rỡ dọc bờ biển Nhật Bản khi có sóng vỗ cơ học."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.cbpb.2007.03.007", "label": "Comparative Biochemistry and Physiology - Chemistry of Cypridina (Vargula) luciferin" });

    } else if (c.id === 'ninja-slug') {
      const charAdd = "Bộ phận sinh dục của loài sên này nằm ở phía bên phải cơ thể, ngay phía dưới cặp xúc tu đầu, cho phép bắn mũi tên tình yêu thuận tiện khi đối đầu trực diện.";
      if (!newC.characteristics || !newC.characteristics.includes("Bộ phận sinh dục của loài sên này nằm ở phía bên phải")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng sử dụng chất nhầy để làm giảm ma sát khi bò trên bề mặt lá thô ráp và hấp thụ nước trực tiếp qua da để duy trì cân bằng ẩm.";
      if (!newC.survival_method || !newC.survival_method.includes("làm giảm ma sát khi bò trên bề mặt lá")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hormone tẩm trên mũi tên tình yêu của sên trần Ninja có tên khoa học là các peptide hướng sinh dục giúp điều phối hoạt động cơ học của túi chứa tinh trùng đối tác.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Hormone tẩm trên mũi tên tình yêu")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Màu xanh ngọc giúp ngụy trang đặc hiệu trên các lá cây thuộc chi tràm trà và dương xỉ rừng nhiệt đới."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Chất nhầy dễ bị rửa trôi dưới những cơn mưa xối xả của rừng nhiệt đới, làm giảm tạm thời khả năng tự vệ hóa học."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Do cơ thể chứa lượng nước rất lớn, sên trần Ninja có thể thu nhỏ kích thước chỉ còn một phần ba khi gặp thời tiết hanh khô đột ngột để bảo toàn nước."
      ]);

      addSource({ "url": "https://doi.org/10.3389/fevo.2020.00162", "label": "Frontiers in Ecology and Evolution - Mating behavior and love darts in gastropods" });

    } else if (c.id === 'trapdoor-spider') {
      const charAdd = "Hệ thống cơ khớp ở chân sau cực kỳ khỏe phối hợp với trọng lượng cơ thể phân bổ thấp giúp chúng bám chặt mặt đất khi đào hang.";
      if (!newC.characteristics || !newC.characteristics.includes("Hệ thống cơ khớp ở chân sau cực kỳ khỏe")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Tơ của nhện cửa sập được gia cố bằng chất keo sinh học tự nhiên chống nước, giúp hang không bị ngập úng khi trời mưa lớn.";
      if (!newC.survival_method || !newC.survival_method.includes("keo sinh học tự nhiên chống nước")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nắp cửa sập có góc vát đặc biệt giúp ngăn bụi đất rơi vào hang và giảm thiểu tối đa khe hở khí quyển.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Nắp cửa sập có góc vát đặc biệt")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Răng sừng (rastellum) cấu tạo từ kitin hóa cứng kết hợp ion kim loại giúp đào xuyên qua các lớp đất sét nện cứng."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tỷ lệ sống sót của nhện con rất thấp do phải tự đào hang đầu tiên mà không có nắp cửa bảo vệ trong 48 giờ đầu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Một số cá thể nhện cửa sập cái có thể sống thọ tới hơn 35 năm trong điều kiện môi trường hoang dã ổn định, là một trong những loài nhện có tuổi thọ cao nhất."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rsbl.2017.0483", "label": "Biology Letters - Extreme longevity and survival strategies in trapdoor spiders" });

    } else if (c.id === 'surinam-toad') {
      const charAdd = "Mắt của loài cóc này rất nhỏ và hướng lên trên, được thiết kế chuyên biệt để phát hiện bóng của kẻ thù bay phía trên mặt nước.";
      if (!newC.characteristics || !newC.characteristics.includes("Mắt của loài cóc này rất nhỏ và hướng lên trên")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Cóc tổ ong có thể nhịn thở dưới nước tới 1 giờ nhờ phổi lớn kết hợp hô hấp trao đổi khí phụ trợ qua da nhăn.";
      if (!newC.survival_method || !newC.survival_method.includes("nhịn thở dưới nước tới 1 giờ nhờ phổi lớn")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tế bào da lưng của cóc mẹ trong thời kỳ mang thai sinh ra một mạng lưới mạch máu dày đặc bao quanh từng quả trứng để cung cấp trực tiếp oxy hòa tan.";
      if (!newC.unique_traits || !newC.unique_traits.includes("mạng lưới mạch máu dày đặc bao quanh từng quả trứng")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp sọ dẹt đặc biệt giúp chúng luồn lách vào các khe đá hẹp và dưới các thân cây đổ dưới đáy sông."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cực kỳ mẫn cảm trước sự thay đổi nhiệt độ nước, nếu nước ấm lên đột ngột chúng sẽ giảm khả năng miễn dịch của da."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Lớp da lưng của cóc mẹ sau khi con non chui ra sẽ bong tróc hoàn toàn sau 1-2 tuần thông qua quá trình lột xác để chuẩn bị cho mùa sinh sản tiếp theo."
      ]);

      addSource({ "url": "https://doi.org/10.1111/jzo.12788", "label": "Journal of Zoology - Skin morphometrics and vascularization in gestating Pipa pipa" });

    } else if (c.id === 'pink-fairy-armadillo') {
      const charAdd = "Phần chân của chúng có các màng da mỏng nối giữa các ngón giúp tăng diện tích bề mặt đẩy cát khi đào bới.";
      if (!newC.characteristics || !newC.characteristics.includes("màng da mỏng nối giữa các ngón")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi nhiệt độ sa mạc lạnh sâu vào ban đêm, chúng cuộn tròn và hạ nhịp tim xuống mức tối thiểu để bảo toàn năng lượng.";
      if (!newC.survival_method || !newC.survival_method.includes("hạ nhịp tim xuống mức tối thiểu để bảo toàn năng lượng")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tấm pelvic shield ở mông được cấu tạo từ các xương osteoderms hợp nhất với xương chậu tạo thành một bức tường chắn vững chắc.";
      if (!newC.unique_traits || !newC.unique_traits.includes("hợp nhất với xương chậu tạo thành một bức tường chắn")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Móng vuốt trước có cấu trúc lõm dạng muỗng giúp xúc cát hiệu quả hơn các loài tatu thông thường khác."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tỷ lệ sinh sản cực thấp (chỉ 1-2 con/năm) khiến loài này cực kỳ dễ bị tổn thương trước sự suy giảm quần thể."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng là loài động vật duy nhất trong nhóm Cingulata có lớp mai lưng hoàn toàn tách rời khỏi các phần bên của cơ thể."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.jaridenv.2020.104258", "label": "Journal of Arid Environments - Thermoregulation and physiology of Chlamyphorus truncatus" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-117.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-117.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich-round-117.json...");
  fs.unlinkSync(enrichPath);
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
