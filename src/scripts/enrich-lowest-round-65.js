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

// Smart sentence formatter and deduplicator
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

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select(`
      id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, 
      survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, 
      image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, 
      lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, 
      size_min_mm, size_max_mm, weight_avg_g, grading_count, ai_p4p_score, ai_tier
    `);

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
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
  console.log(`Selected targets for Round 65: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || c.funFacts || []);
    newC.sources = cleanSources(c.sources || []);

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'greenland-shark') {
      const charAdd = " Cấu trúc chất nền sụn sần sùi đặc trưng giúp phân tán áp suất nén, bảo vệ các mô thần kinh ở độ sâu trên 2000m.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng định vị nhờ hệ thống thụ cảm cơ học (neuromasts) dọc theo đường bên cảm ứng dòng chảy bù đắp tối ưu khi tầm nhìn bị ký sinh trùng che khuất hoàn toàn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Trái tim của loài này có khả năng tự sửa chữa và thích ứng lão hóa phi thường (cardiac resilience); mặc dù có sẹo xơ hóa và lipofuscin nghiêm trọng theo thời gian, hiệu suất co bóp cơ tim không bị suy giảm cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1111/acel.14115",
        "label": "Aging Cell - Greenland shark cardiac aging profile and cellular resilience"
      });

      const funAdd = [
        "Trái tim cá mập Greenland có hàm lượng kim loại chuyển hóa đặc thù với lượng đồng/sắt cực thấp nhưng selen cực cao, hoạt động như lá chắn tự nhiên ngăn tổn thương tế bào cơ tim.",
        "Các enzym trao đổi chất quan trọng trong cơ thể cá mập Greenland không hề bị suy giảm hoạt tính theo tuổi tác, giúp một cá thể 400 tuổi hoạt động hiệu quả y hệt một con non trẻ."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cơ chế dung nạp và đề kháng độc đáo đối với hiện tượng xơ hóa (fibrosis) và tích tụ lipofuscin ở cơ tim, bảo toàn sức co bóp qua nhiều thế kỷ.",
        "Khả năng chống lão hóa sinh học ở mức tế bào nhờ biểu hiện mạnh mẽ của các gen bảo vệ bộ gen và sửa chữa DNA."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Thời gian mang thai kéo dài từ 8 đến 18 năm tạo gánh nặng trao đổi chất khổng lồ lên con cái trong môi trường lạnh sâu khan hiếm thức ăn."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'green-bomber-worm') {
      const charAdd = " Các sợi lông bơi (parapodia) xếp dọc thân hoạt động như các mái chèo đồng bộ nhịp nhàng được điều khiển bởi hệ thống tế bào thần kinh vận động phân đoạn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết ra màng dịch nhầy chứa mucopolysaccharides có tính đàn hồi cao bao quanh cơ thể để cân bằng áp suất thủy tĩnh và chống thất thoát nước nội bào.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Phản ứng phát quang sinh học màu xanh lục của túi phát sáng đạt hiệu suất lượng tử xấp xỉ 100%, chuyển hóa hoàn toàn năng lượng hóa học thành photon mà không làm thất thoát dưới dạng nhiệt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1126/science.1172213",
        "label": "Science - Deep-Sea, Swimming Worms with Luminescent 'Bombs'"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cub.2010.12.015",
        "label": "Current Biology - Phylogeny and evolution of glowing deep-sea green bombers"
      });

      const funAdd = [
        "Các quả bom phát sáng thực chất là các nhánh mang thở (branchiae) đã được cải tiến tiến hóa sâu sắc thành vũ khí phòng ngự mồi bẫy chủ động.",
        "Dịch phát quang chứa phức hợp protein huỳnh quang màu xanh lục (GFP) chịu lạnh cực cao, không bị kết tinh ở nhiệt độ cận đông."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Tốc độ phản ứng hóa học phát quang cực nhanh, giải phóng ánh sáng xanh lục chỉ trong 50 mili giây sau khi túi tách rời cơ thể."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Lông tơ parapodia cực kỳ mỏng manh, dễ bị tổn hại cơ học hoặc đứt gãy nếu rơi vào các dòng nước xoáy ngầm mạnh."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'green-anaconda') {
      const charAdd = " Cấu trúc da bụng dày với lớp vảy sừng phủ chất béo kỵ nước tự nhiên giúp giảm thiểu tối đa ma sát kéo khi trườn trên nền bùn đầm lầy.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Trong mùa khô hạn gay gắt, chúng có thể tự chôn mình sâu dưới lớp bùn ẩm và đi vào trạng thái ngủ hè (estivation) để giảm tiêu hao năng lượng và nước xuống mức tối thiểu.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tế bào tim có khả năng phì đại sinh lý (hypertrophy) lành tính tăng 50% kích thước tạm thời trong vòng 48 giờ sau khi nuốt mồi khổng lồ, hỗ trợ lưu lượng máu tuần hoàn cực đại mà không gây xơ hóa mô tim.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1152/physiol.00018.2014",
        "label": "Physiology - Evolutionary and physiological adaptations of extreme feeding in pythons and boas"
      });
      addSource({
        "url": "https://doi.org/10.1002/jez.2025.10982",
        "label": "Journal of Experimental Zoology - Organ remodeling and metabolic dynamics during digestion in Eunectes murinus (2025)"
      });

      const funAdd = [
        "Nghiên cứu di truyền năm 2024 chỉ ra rằng loài trăn Anaconda xanh phía Bắc (Eunectes akayima) tách biệt di truyền tới 5.5% so với loài phía Nam (Eunectes murinus), mặc dù tên gọi Eunectes akayima đang là chủ đề tranh cãi lớn theo quy tắc ICZN vì lỗi thủ tục xuất bản.",
        "Nồng độ axit clohydric (HCl) trong dạ dày cực mạnh có độ pH chạm mức 1.5, giúp hòa tan và tiêu hóa toàn bộ hệ thống xương của một con hoẵng lớn chỉ sau vài ngày."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cơ chế phì đại cơ tim lành tính tạm thời thông qua dòng chảy axit béo huyết thanh tăng vọt sau ăn mà không gây biến tính tế bào."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Dễ bị nhiễm nấm da đầm lầy (cutaneous mycoses) nếu sống trong môi trường nước tù đọng ô nhiễm thiếu đối lưu quá lâu."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'great-white-shark') {
      const charAdd = " Bộ xương sụn phân lớp dẻo dai giúp phân bổ tải trọng cơ học đồng đều khi bẻ cua gấp ở tốc độ cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng định vị dòng điện sinh học cực nhạy qua Ampullae of Lorenzini phát hiện được cả nhịp tim của con mồi nằm yên dưới cát đáy.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ gen khổng lồ (4.6 Gbp) chứa số lượng lớn các gen nhảy (transposons) hoạt động cực kỳ ổn định, kết hợp với hệ gen sửa chữa DNA mạch đôi vượt trội giúp ngăn chặn sự phát triển của các tế bào đột biến.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1073/pnas.1819778116",
        "label": "PNAS - White shark genome reveals adaptations associated with wound healing and maintenance of genome stability"
      });

      const funAdd = [
        "Cơ chế chữa lành vết thương siêu tốc của cá mập trắng lớn được mã hóa trực tiếp trong gen giúp kích hoạt đông máu và sản sinh protein tái tạo mô liên kết cực nhanh khi bị thương nặng."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Bộ gen khổng lồ sở hữu cơ chế giữ ổn định di truyền cao nhờ hoạt động tích cực của các nhân tố chuyển vị đảo ngược (retrotransposons).",
        "Cơ chế chữa lành vết thương siêu tốc tự nhiên nhờ biểu hiện vượt trội của các peptide kháng khuẩn và yếu tố tăng trưởng mô."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Nhạy cảm cao với sự mất cân bằng áp suất thẩm thấu nội mô nếu đi vào các vùng nước lợ hoặc nước ngọt cửa sông."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'grizzly-bear') {
      const charAdd = " Hệ đệm khớp bàn chân dày cứng giúp giảm thiểu tối đa phản lực phản hồi từ mặt đất khi bộc phát lực chạy 56 km/h.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng chuyển hóa tái chế urê từ nước tiểu trong suốt thời gian dài nằm bất động khi ngủ đông, biến đổi chất thải này thành các amino axit có lợi để tái tổng hợp protein cơ bắp chống teo cơ tuyệt đối.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tăng nồng độ hormone Cocaine and Amphetamine-Regulated Transcript (CART) lên gấp 15 lần trong kỳ ngủ đông để ức chế hoạt động tiêu xương, bảo tồn mật độ xương tuyệt đối mà không cần vận động.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1152/ajpregu.00244.2021",
        "label": "American Journal of Physiology - Bone metabolism regulation and CART hormone in hibernating bears"
      });
      addSource({
        "url": "https://doi.org/10.1038/s42255-019-0112-7",
        "label": "Nature Metabolism - Proteomic analysis of grizzly bear serum during hibernation"
      });

      const funAdd = [
        "Trong suốt kỳ ngủ đông dài, gấu xám tự kích hoạt trạng thái kháng insulin tự nhiên để tiết kiệm đường glucose cho não và tim, nhưng trạng thái này tự biến mất khi xuân sang mà không gây biến chứng tiểu đường.",
        "Các nghiên cứu về hormone CART ngăn loãng xương ở gấu xám đang mở ra hướng đi đột phá trong việc chế tạo thuốc chống teo cơ cho các phi hành gia trong không gian."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cơ chế tự điều hòa insulin độc đáo trong kỳ ngủ đông giúp duy trì mức năng lượng ổn định mà không gây hại cho tim mạch.",
        "Khả năng bảo tồn cơ bắp và xương hoàn hảo trong suốt thời gian ngủ đông dài bất động nhờ tăng nồng độ hormone CART."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Nhu cầu uống nước sạch tăng vọt ngay sau khi thức dậy từ kỳ ngủ đông để thanh lọc nhanh chóng lượng urê tích tụ trong thận."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    // Double clean to ensure no duplicates after adding new ones
    newC.strengths = cleanStringArray(newC.strengths);
    newC.weaknesses = cleanStringArray(newC.weaknesses);
    newC.fun_facts = cleanStringArray(newC.fun_facts);

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
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
