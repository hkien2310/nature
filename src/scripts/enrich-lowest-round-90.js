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
      // Ignore parsing error, keep as is
    }
  }
  return trimmed;
};

async function run() {
  const targetsPath = path.join(__dirname, "temp-targets.json");
  const enrichPath = path.join(__dirname, "temp-enrich.json");

  if (!fs.existsSync(targetsPath)) {
    console.error("temp-targets.json not found! Please run get-enrichment-targets.js first.");
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  const targets = fileData.targets;

  console.log(`Selected targets for Round 90: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean character array bugs in unique_traits
    newC.unique_traits = fixUniqueTraits(c.unique_traits);

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    // Clean diet items
    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'blue-footed-booby') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá mòi", "cá cơm", "cá thu", "cá chuồn", "mực nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (thường từ 1-3 quả). Thời gian ấp trứng kéo dài khoảng 41-45 ngày. Cả chim bố và chim mẹ đều tham gia ấp trứng bằng cách dùng đôi chân xanh ấm áp của mình phủ lên trứng (vì loài này không có đốm ấp ở bụng). Chim non được nuôi dưỡng bằng thức ăn mớm mồi.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 97.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 760.0;
      newC.size_max_mm = 840.0;
      newC.weight_avg_g = 1500.0;

      const charAdd = "Lớp da quanh cổ họng có khả năng co giãn đặc biệt phối hợp với hệ thống túi khí dưới da đầu hoạt động như bộ đệm giảm chấn sinh học bảo vệ đại não khỏi áp lực va đập khi lao đầu xuống nước.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng thực hiện chiến thuật lặn săn mồi theo nhóm (communal diving) bằng cách đồng loạt lao xuống nước theo tín hiệu tiếng còi của một con dẫn đầu, tạo nên thế trận bao vây làm hoảng loạn các đàn cá mòi dưới nước.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Màu xanh lam của chân được quyết định bởi tỷ lệ liên kết hóa học giữa carotenoid astaxanthin và các protein huyết thanh. Nếu chim bị đói hoặc bệnh chỉ trong 48 giờ, sắc độ xanh của chân sẽ nhạt đi rõ rệt.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ cơ bụng và cơ cổ cực kỳ săn chắc, giúp giữ cơ thể thẳng như một mũi tên khi va chạm với nước ở tốc độ cao.",
        "Tỷ lệ trao đổi chất cơ bản thấp giúp chúng duy trì các chuyến bay trinh sát kéo dài nhiều giờ trên biển mà không kiệt sức."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hệ thống làm mát cơ thể thụ động phụ thuộc vào hành vi thở hổn hển (gular fluttering) làm tiêu hao nhiều nước.",
        "Độ nhạy cảm cao với sự thay đổi của nhiệt độ nước biển (như hiện tượng El Niño), dẫn đến thiếu hụt dinh dưỡng nghiêm trọng cho chim non."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khác với các loài chim khác, chim điên chân xanh dùng chính màng chân dày rực rỡ của mình thay thế cho miếng ấp trứng ở bụng để giữ ấm cho tổ trứng.",
        "Khi ngủ trên biển, chúng có thể nhắm một mắt và giữ một nửa bán cầu não hoạt động (unihemispheric slow-wave sleep) để liên tục cảnh giác cá mập."
      ]);

      addSource({ "url": "https://doi.org/10.1086/505514", "label": "The American Naturalist - Foot colour and condition in the Blue-footed Booby" });
      addSource({ "url": "https://doi.org/10.1093/beheco/arl047", "label": "Behavioral Ecology - Signaling value of foot color in Sula nebouxii" });

    } else if (c.id === 'laughing-kookaburra') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["rắn độc", "thằn lằn", "chuột nhắt", "côn trùng lớn", "ếch nhái", "chim nhỏ", "tôm nước ngọt"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng trong các hốc cây lớn (thường từ 2-4 quả trứng). Thời gian ấp trứng kéo dài khoảng 24-26 ngày. Loài này có tập tính sinh sản hợp tác (cooperative breeding), trong đó các con non lớn từ mùa trước sẽ ở lại hỗ trợ bố mẹ ấp trứng, bảo vệ lãnh thổ và mớm mồi cho con non mới nở.";
      newC.locomotion = 'fly';
      newC.speed_max = 45.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 390.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 350.0;

      const charAdd = "Bộ lông có cấu trúc vi mô bẫy không khí cách nhiệt tuyệt đối giúp duy trì thân nhiệt ổn định trong các đêm đông lạnh giá ở vùng núi Úc.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng phát triển hành vi đập mồi cơ học: sau khi kẹp chặt rắn độc hoặc thằn lằn bằng mỏ, chúng quật mạnh liên tiếp con mồi vào vỏ cây khô cứng cho đến khi toàn bộ xương sống của con mồi bị bẻ gãy hoàn toàn, làm tê liệt tuyến độc trước khi nuốt.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu tần số tiếng cười đạt ngưỡng 110-120 decibel, có khả năng kích hoạt đồng bộ toàn bộ thành viên trong gia đình để tạo thành một dàn hợp xướng tiếng cười lập tức lấn át âm thanh của các loài chim cạnh tranh khác.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ cơ và xương cổ chịu tải cực cao, chịu được mô-men xoắn lớn sinh ra khi quật mạnh mồi xuống đá cứng.",
        "Mỏ sừng dày có khả năng chống mài mòn hóa học và cơ học, hoạt động như một cái kẹp lực đẩy mạnh."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ cơ động thấp trong môi trường rừng rậm rạp do cấu trúc cánh ngắn tròn không phù hợp lượn lách phức tạp.",
        "Tỷ lệ sống sót của chim non đầu lòng bị đe dọa bởi tập tính cạnh tranh tàn sát lẫn nhau (siblicide) dữ dội nếu thiếu thức ăn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kookaburra hỷ kịch thực chất là loài chim bói cá lớn nhất thế giới, nhưng chúng gần như không bao giờ ăn cá và cực kỳ sợ nước sâu.",
        "Tiếng cười đặc trưng của chúng thực chất là một chuỗi phức tạp bao gồm các âm 'cooee' và tiếng cười giã giã 'ha-ha-ha', bắt đầu từ tiếng ríu rít nhỏ và tăng dần cao độ."
      ]);

      addSource({ "url": "https://doi.org/10.1071/MU9940179", "label": "Emu - Brood reduction and siblicide in the Cooperatively Breeding Laughing Kookaburra" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2008.00511.x", "label": "Journal of Zoology - Vocal matching and territorial defense in Dacelo novaeguineae" });

    } else if (c.id === 'sawfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá mòi", "cá cơm", "tôm sông", "cua bùn", "mực ống", "giun nhiều tơ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 25;
      newC.lifespan_max = 35;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Trứng phát triển bên trong cơ thể mẹ và nở thành con non trước khi sinh ra. Thời gian mang thai kéo dài khoảng 5 tháng. Mỗi lứa sinh từ 1-12 con non. Để bảo vệ cá mẹ, mõm đao của cá con khi sinh ra được bọc trong một màng gelatin mềm bảo vệ, màng này sẽ tự tiêu biến hoàn toàn sau vài ngày tiếp xúc với nước biển.";
      newC.locomotion = 'swim';
      newC.speed_max = 25.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 5000.0;
      newC.size_max_mm = 7000.0;
      newC.weight_avg_g = 500000.0;

      const charAdd = "Hệ thống xương sụn mõm đao được gia cố bằng mạng lưới tinh thể hydroxyapatite hóa vôi đa lớp, tăng mô-đun đàn hồi gấp 5 lần sụn thông thường để chống gãy gập.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng mõm đao quét sát mặt đáy bùn để tạo ra dòng nước cuốn đẩy trôi các sinh vật giáp xác ẩn nấp bên dưới, sau đó cắm đao xuống khóa chặt và nghiền nát vỏ cứng của chúng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu hơn 8.000 lỗ thụ cảm điện Lorenzini phân bố dày đặc dọc theo hai mặt mõm đao, cho phép chúng lập bản đồ không gian điện trường 3D của môi trường xung quanh trong bóng tối hoàn toàn.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng sinh tồn vượt trội trong vùng nước lợ có nồng độ oxy cực thấp nhờ cơ chế kiểm soát hô hấp giảm tần suất bơm mang chủ động.",
        "Vảy nhám plasmoid bao phủ da giúp giảm thiểu tối đa lực cản ma sát của dòng nước khi bơi ở tầng đáy sông."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ quan mõm đao cồng kềnh tạo ra lực cản thủy động học rất lớn khi cố gắng bơi ngược dòng chảy siết.",
        "Độ nhạy điện trường bị suy giảm nghiêm trọng khi nguồn nước bị nhiễm mặn cao hoặc ô nhiễm kim loại nặng tích tụ ở đáy sông."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Dù trông giống cá mập, cá đao thực chất lại thuộc nhóm cá đuối (Batoidea), với khe mang nằm ở mặt dưới cơ thể chứ không phải hai bên sườn.",
        "Chúng là loài cá sụn hiếm hoi có khả năng sinh sản vô tính trinh sản (parthenogenesis) trong tự nhiên khi quần thể bị suy giảm nghiêm trọng."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.cub.2015.04.017", "label": "Current Biology - Facultative parthenogenesis in a critically endangered wild vertebrate" });
      addSource({ "url": "https://doi.org/10.1111/jfb.12743", "label": "Journal of Fish Biology - Biology and conservation status of Pristis pristis" });

    } else if (c.id === 'poison-dart-frog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["bọ cánh cứng", "kiến rừng", "mối hoang", "ruồi giấm", "nhện nhỏ", "côn trùng nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ khoảng 10-20 quả trứng trên lá ẩm hoặc hốc đất ẩm. Con đực có nhiệm vụ canh gác và giữ ẩm cho trứng. Sau khi trứng nở thành nòng nọc (khoảng 10-14 ngày), con đực sẽ cõng từng con nòng nọc trên lưng vượt qua các thân cây cao để thả vào các vũng nước nhỏ tích tụ trong kẽ lá cây họ Dứa (Bromeliads), nơi chúng phát triển độc lập.";
      newC.locomotion = 'crawl';
      newC.speed_max = 5.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 47.0;
      newC.size_max_mm = 55.0;
      newC.weight_avg_g = 3.0;

      const charAdd = "Tuyến độc biểu bì (cutaneous granular glands) tích tụ và bài tiết lượng batrachotoxin cực lớn, phân bố đồng đều dưới lớp biểu bì để ngăn chặn bất kỳ sự tiếp xúc trực tiếp nào từ kẻ thù.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng phát triển chiến thuật xua đuổi bằng màu sắc aposematic sáng rực (vàng chanh, cam hoặc xanh mint) kết hợp hoạt động công khai giữa ban ngày để tối ưu hóa việc truyền phát tín hiệu cảnh báo độc tố chết người.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Đột biến axit amin đơn lẻ trên kênh natri điện thế Nav1.4 (thay thế khớp nối phân tử batrachotoxin) giúp bảo vệ hệ thần kinh của ếch hoàn toàn khỏi sự khóa hoạt động của độc tố của chính nó.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Độc tố thần kinh batrachotoxin có tính ổn định hóa học cực cao, không bị phân hủy bởi ánh sáng mặt trời hoặc độ ẩm rừng mưa.",
        "Lưỡi phủ chất nhầy glycoprotein có độ dính đặc biệt cao giúp phóng bắt mồi siêu tốc trong vòng 0.05 giây."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Lớp da hô hấp cực mỏng không thể chống chịu chất tẩy rửa sinh học hoặc hóa chất nông nghiệp trôi nổi trong nước.",
        "Khả năng chịu nhiệt kém, hệ thống sinh học sẽ rơi vào sốc nhiệt và tử vong nếu nhiệt độ môi trường vượt quá 30 độ C trong 2 giờ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Ếch phi tiêu vàng nuôi nhốt từ nhỏ hoàn toàn không có độc do thiếu nguồn thức ăn côn trùng tự nhiên chứa tiền chất alkaloid để tổng hợp batrachotoxin.",
        "Chỉ cần 1 microgam chất độc batrachotoxin của loài này là đủ để gây suy tim cấp và cướp đi sinh mạng của một người trưởng thành trong vòng vài phút."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.ejphar.2019.172821", "label": "European Journal of Pharmacology - Batrachotoxin interaction with voltage-gated sodium channels" });
      addSource({ "url": "https://doi.org/10.3389/fphys.2020.590123", "label": "Frontiers in Physiology - Toxic defenses and resistance mechanisms in poison frogs" });

    } else if (c.id === 'saharan-silver-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["xác côn trùng", "nhện nhỏ chết khô", "ấu trùng chết nắng"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính phân hóa xã hội bầy đàn. Kiến chúa thụ tinh sinh ra hàng triệu kiến thợ vô sinh. Các chuyến bay giao phối (nuptial flights) diễn ra vào mùa xuân ngắn ngủi sau những cơn mưa hiếm hoi, nơi kiến đực và kiến chúa trẻ giao phối trên không.";
      newC.locomotion = 'walk';
      newC.speed_max = 0.855;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 8.0;
      newC.size_max_mm = 12.0;
      newC.weight_avg_g = 0.02;

      const charAdd = "Bộ lông bạc cấu tạo từ các sợi chitin có tiết diện tam giác đều với hai mặt phẳng phản xạ ánh sáng và một mặt gồ ghề tiếp xúc da giúp tối ưu hóa cả sự phản xạ quang phổ nhìn thấy lẫn sự bức xạ nhiệt hồng ngoại thụ động.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng áp dụng chiến thuật định hướng không gian bằng la bàn phân cực ánh sáng mặt trời kết hợp đếm bước chân (odometry) để liên tục cập nhật vector đường về tổ ngắn nhất dưới nắng nóng thiêu đốt.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống tổng hợp protein sốc nhiệt (HSP70 và HSP90) được kích hoạt trước khi rời hang ở tốc độ cao, ngăn ngừa tuyệt đối sự đông tụ albumin và các enzyme quan trọng trong tế bào khi cơ thể nóng lên đến 53.6°C.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tỷ lệ phản xạ nhiệt hồng ngoại thụ động qua lông bạc đạt hơn 95%, giúp giảm nhiệt độ bề mặt cơ thể xuống thấp hơn 10 độ C so với môi trường.",
        "Hệ cơ chân dài phân bổ lực đẩy đồng đều, giúp giảm diện tích tiếp xúc với các tinh thể cát nóng 70 độ C."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tốc độ thoát hơi nước qua các lỗ thở khí quản (spiracles) tăng nhanh khi nhiệt độ cơ thể đạt ngưỡng 50 độ C, giới hạn thời gian hoạt động tối đa ở mức 10-15 phút.",
        "Mất khả năng định vị và dẫn đường về tổ nếu bầu trời bị che phủ hoàn toàn bởi mây dày làm mất đi ánh sáng phân cực."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kiến bạc Sahara thực sự 'bay' trên cát: ở tốc độ chạy cao nhất, chúng chuyển sang di chuyển phi nước kiệu, nhấc toàn bộ 6 chân khỏi mặt đất cùng lúc trong các khoảng thời gian ngắn để tránh bỏng chân.",
        "Học thuyết quang học từ bộ lông của loài kiến này đang được ứng dụng để phát triển các loại sơn tự làm mát thụ động không cần điện cho các tòa nhà hiện đại."
      ]);

      addSource({ "url": "https://doi.org/10.1126/science.aab3561", "label": "Science - Keeping cool: Saharan silver ants reflect light to stay cool" });
      addSource({ "url": "https://doi.org/10.3389/fphys.2021.684125", "label": "Frontiers in Physiology - High-speed locomotion mechanics of Cataglyphis bombycina" });
    }

    return newC;
  });

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
  console.log("Cleaning up temp files...");
  try {
    fs.unlinkSync(targetsPath);
    fs.unlinkSync(enrichPath);
    console.log("Cleanup done.");
  } catch (cleanupErr) {
    console.error("Error cleaning up files:", cleanupErr.message);
  }

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
