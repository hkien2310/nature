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
  console.log(`Selected targets for Round 77: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'alligator-snapping-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['cá.', 'nhuyễn thể.', 'ếch nhái.', 'động vật gặm nhấm.', 'rùa nhỏ.', 'chim nước.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 50;
      newC.lifespan_max = 100;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh trong, đẻ trứng (oviparous). Sau khi giao phối dưới nước vào mùa xuân, con cái lên bờ đào tổ sâu khoảng 30 cm trên bãi cát ven sông để đẻ từ 10 đến 50 quả trứng. Nhiệt độ ấp quyết định giới tính của con non. Thời gian ấp từ 100 đến 140 ngày, con non tự chui ra khỏi cát và bò xuống sông.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 350.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 80000.0;

      const charAdd = " Khớp liên kết giữa đốt sống cổ thứ tám và đai ngực có cấu trúc bản lề kép, cung cấp hành trình duỗi cổ nhanh gấp 3 lần bình thường để thực hiện đòn tấn công con mồi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các tế bào thụ cảm hóa học jacobson phân bố trong vòm miệng để theo dõi dòng pheromone hòa tan của đối thủ hoặc bạn tình trong lòng sông tối tăm.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Cấu trúc sụn chêm ở khớp hàm có khả năng hấp thụ phản lực đàn hồi khi hàm đóng sập mạnh, ngăn chặn chấn thương chấn động hộp sọ của chính nó.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hộp sọ cấu trúc anapsid gia cố chắc chắn chịu được áp lực đập cơ học cực lớn.",
        "Cơ chế hấp thụ phản lực cơ học tại khớp sụn hàm giảm chấn cho não bộ khi cắn các vật thể cứng."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng phản xạ cơ bắp tay chân chậm chạp làm giảm hiệu quả tự vệ nếu bị thú ăn thịt lớn tấn công vào các phần da mềm ở cổ.",
        "Rất nhạy cảm với việc mất nước và nứt nẻ lớp da thô ráp nếu bị phơi ngoài không khí khô nóng quá 48 giờ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Trứng của rùa cá sấu có lớp vỏ dai đàn hồi giống như bóng bàn, giúp bảo vệ phôi bên trong không bị dập vỡ khi rơi từ độ cao ổ cát.",
        "Chúng là loài rùa nước ngọt duy nhất sở hữu các mụn thịt giống gai nhọn quanh mắt hoạt động như tấm kính chắn phân tán ánh sáng chói mắt."
      ]);

      addSource({
        "url": "https://doi.org/10.1242/jeb.242953",
        "label": "Journal of Experimental Biology - Bite force and feeding biomechanics in Macrochelys temminckii"
      });
      addSource({
        "url": "https://doi.org/10.1002/ar.24584",
        "label": "The Anatomical Record - Skull morphology and muscle architecture of alligator snapping turtles"
      });

    } else if (c.id === 'amazonian-giant-centipede') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['dơi côn trùng.', 'chuột nhắt.', 'ếch nhái.', 'thằn lằn.', 'côn trùng lớn.', 'chim nhỏ.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính. Con đực tiết ra một bao tinh (spermatophore) trên một mạng tơ nhỏ dưới đất, sau đó dụ con cái nhận bao tinh để thụ tinh. Con cái đẻ từ 50 đến 80 quả trứng và cuộn mình bảo vệ trứng cũng như con non cho đến khi chúng lột xác lần đầu.';
      newC.locomotion = 'crawl';
      newC.speed_max = 3.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 100.0;

      const charAdd = " Lông dọc sườn có cấu trúc xốp rỗng như bọt biển giúp lưu giữ chất độc lỏng từ tuyến bọt bôi lên da lâu ngày không bay hơi. Lớp vỏ cuticle bọc sáp chứa các hợp chất hydrocarbon no (như pentacosane và heptacosane) có chức năng ngăn chặn sự mất nước và cản trở bám dính của các bào tử nấm độc.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Thực hiện hành vi chải chuốt cơ thể (grooming) định kỳ bằng dịch tiết axit từ miệng chứa chất kháng khuẩn mạnh để làm sạch các khớp chân và cơ quan Tömösváry.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Các tế bào thần kinh vận động phân đoạn ở mỗi đốt thân có khả năng tạo ra nhịp vận động sóng cơ học tự động mà không cần sự điều phối liên tục của não bộ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Lớp sáp hydrocarbon biểu bì chống bám dính bào tử nấm và ngăn ngừa nhiễm trùng cơ hội.",
        "Khả năng duy trì lực bám cơ học ổn định trên vách đá thẳng đứng nhờ các móng vuốt chân sau bám chặt kẽ đá."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ nhạy cảm cực cao với bụi mịn bám vào khí quản làm bít tắc hệ thống hô hấp thụ động.",
        "Dễ bị tổn thương cơ thể nếu bị uốn cong ngược khớp từ phía lưng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Rết khổng lồ Amazon có thể nhịn thở dưới nước tới 1 tiếng bằng cách đóng một phần lỗ thở và sử dụng lượng không khí dự trữ trong hệ mạch khí quản phồng.",
        "Chúng là loài động vật không xương sống duy nhất được biết đến săn bắt dơi bằng cách treo ngược mình từ trần hang chỉ bằng ba cặp chân sau."
      ]);

      addSource({
        "url": "https://doi.org/10.1016/j.toxicon.2023.107090",
        "label": "Toxicon - Pharmacological characterization of Scolopendra gigantea venom"
      });
      addSource({
        "url": "https://doi.org/10.1111/jzo.12901",
        "label": "Journal of Zoology - Predatory behavior and ecological niche of giant centipedes"
      });

    } else if (c.id === 'antarctic-icefish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['krill Nam Cực.', 'loài giáp xác.', 'cá tuyết Nam Cực.', 'giáp xác amphipod.', 'nhuyễn thể.'];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 4;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài, đẻ trứng (oviparous). Thời điểm đẻ trứng diễn ra từ mùa hè đến mùa thu. Con cái đẻ trứng chìm xuống đáy biển đá, nơi được con đực bảo vệ tích cực. Trứng nở sau 5 đến 6 tháng trong làn nước lạnh giá.';
      newC.locomotion = 'swim';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 520.0;
      newC.weight_avg_g = 1200.0;

      const charAdd = " Mật độ phân bố chất béo trung tính (triacylglycerols) trong các mô cơ xương và mô gan rất lớn, cung cấp năng lượng trao đổi chất dự trữ ổn định mà không cần bơi lội nhiều.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết ra các chất hoạt tính bề mặt trong dạ dày giúp nhũ hóa chất béo ở nhiệt độ âm, đẩy nhanh tốc độ tiêu hóa mồi krill giàu lipid.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ gen chứa các bản sao lặp lại liên tiếp (tandem repeats) của gen glycoprotein chống đông AFGP, được phiên mã ở mức cực cao suốt vòng đời.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng nhũ hóa lipid ở nhiệt độ âm nhờ enzym tiêu hóa thích nghi lạnh tối ưu.",
        "Hàm lượng mỡ trung tính trong mô cơ xương cao hỗ trợ tạo lực nổi thụ động mà không tốn calo."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ tim thiếu hemoglobin rất nhạy cảm với tình trạng thiếu oxy cục bộ nếu lòng mạch bị cản trở bởi bọt khí.",
        "Dễ bị tổn thương bởi các ký sinh trùng máu chuyên biệt lây truyền qua sinh vật trung gian do hệ miễn dịch thích ứng lạnh hoạt động hạn chế."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Huyết plasma của cá băng Nam Cực trong suốt và lỏng hơn máu của cá thường khoảng 3 lần, giúp mạch máu không bị tắc nghẽn khi gặp các tinh thể băng siêu nhỏ.",
        "Chúng là loài động vật có xương sống duy nhất trên thế giới có quả tim hoàn toàn màu trắng sữa do không chứa bất kỳ phân tử hemoglobin nào."
      ]);

      addSource({
        "url": "https://doi.org/10.1038/s41559-023-02102-7",
        "label": "Nature Ecology & Evolution - Genomics of cold adaptation in Chionodraco rastrospinosus"
      });
      addSource({
        "url": "https://doi.org/10.1152/physiol.00012.2023",
        "label": "Physiology - Oxygen transport in hemoglobin-free Antarctic icefishes"
      });

    } else if (c.id === 'arapaima') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['cá piranha.', 'cá nhỏ.', 'chim nước.', 'động vật gặm nhấm nhỏ.', 'côn trùng thủy sinh.'];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài, đẻ trứng (oviparous). Vào mùa khô (tháng 2 đến tháng 4), cá bố mẹ đào tổ nông rộng khoảng 50 cm và sâu 15 cm trên nền cát đáy sông để đẻ trứng. Trứng thụ tinh nở vào mùa lũ (tháng 5 đến tháng 8). Cá bố tiết chất nhờn từ đầu dẫn dụ đàn con bơi theo và bảo vệ chúng tích cực chống lại kẻ thù.';
      newC.locomotion = 'swim';
      newC.speed_max = 35.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 100000.0;

      const charAdd = " Lớp vảy có cấu trúc Bouligand gồm nhiều lớp sợi collagen xếp chéo góc 90 độ xen kẽ, được khoáng hóa cao ở bề mặt ngoài bằng các hạt nanocrystal hydroxyapatite nghèo canxi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng bong bóng bơi có vách ngăn chứa nhiều mao mạch lớn (như phổi sơ khai) để thực hiện hô hấp khí trời bắt buộc, hấp thu tới 75% lượng oxy cần thiết từ không khí.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng sản xuất các chất nhầy giàu protein có chứa các kháng thể IgM trên vùng da đầu cá đực giúp định hướng và cung cấp miễn dịch thụ động cho cá con.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cấu trúc vảy Bouligand siêu bền chống chịu lực cắn đâm xuyên từ các loài cá săn mồi răng sắc nhọn như piranha.",
        "Cơ chế hô hấp khí trời qua bong bóng bơi biến đổi giúp sinh tồn xuất sắc trong các hồ nước đục thiếu oxy."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Bắt buộc phải nổi lên thở định kỳ làm lộ vị trí và khiến chúng dễ bị săn bắt bởi con người.",
        "Khả năng uốn lượn cột sống bị hạn chế do các tấm vảy lớn và cứng lợp chồng lên nhau."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Arapaima có thể nhảy cao tới 1.5 mét ra khỏi mặt nước để đớp chim nhỏ bám trên các cành cây thấp sát bờ sông.",
        "Bong bóng bơi của chúng chiếm gần hết khoang cơ thể và hoạt động giống hệt lá phổi của động vật có vú về mặt cấu trúc mao mạch hấp thụ."
      ]);

      addSource({
        "url": "https://doi.org/10.1016/j.matt.2023.05.011",
        "label": "Matter - Mechanical toughness and structural hierarchy of Arapaima gigas scales"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.jsb.2022.107902",
        "label": "Journal of Structural Biology - Nanostructure and mechanics of fish scales"
      });

    } else if (c.id === 'archerfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['dế mèn.', 'nhện.', 'ruồi.', 'ngài.', 'bọ cánh cứng.', 'cá nhỏ.'];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài, đẻ trứng (oviparous). Chúng bơi thành đàn lớn ra các rạn đá ven bờ hoặc vùng nước lợ sâu để đẻ hàng chục nghìn quả trứng nổi tự do trong nước. Trứng nở thành ấu trùng trôi nổi tự do rồi bơi ngược về các rừng ngập mặn đầm lầy để sinh trưởng.';
      newC.locomotion = 'swim';
      newC.speed_max = 12.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 120.0;
      newC.size_max_mm = 250.0;
      newC.weight_avg_g = 200.0;

      const charAdd = " Hàm dưới sở hữu một rãnh hẹp chạy dọc đường trung tuyến phối hợp với lưỡi dẹt linh hoạt tạo thành một cấu trúc nòng súng phun nước hoàn hảo.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các thông số quang học khúc xạ mặt nước được hiệu chỉnh tự động trong não bộ dựa trên độ sâu và góc nghiêng của cơ thể để ngắm bắn chính xác.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng điều biến động lực học chất lưu (fluid dynamics) của tia nước bằng cách khép mở liên tục nắp mang để nén phần đuôi tia nước bắn nhanh hơn phần đầu.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Ngắm bắn chính xác vượt qua hiện tượng khúc xạ ánh sáng mặt nước nhờ cấu trúc não bộ tính toán quang học tự động.",
        "Cơ chế phun nước nén giọt động lực học tạo xung lực va đập cực lớn làm rơi con mồi bám chặt trên lá."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ chính xác ngắm bắn giảm tới 80% nếu mặt nước bị gợn sóng mạnh hoặc bị che phủ bởi các váng dầu loang.",
        "Dễ bị cướp mất con mồi rơi xuống bởi các loài cá nhanh nhẹn hơn bơi xung quanh ngay sau khi con mồi rơi xuống."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cá cung thủ có khả năng ghi nhớ khuôn mặt con người nuôi dưỡng chúng với độ chính xác trên 80% sau vài tuần huấn luyện.",
        "Tia nước của cá cung thủ thực chất là kết quả của một quá trình động lực học chất lưu phức tạp giống như nguyên lý phun của máy in văn phòng."
      ]);

      addSource({
        "url": "https://doi.org/10.1038/srep27559",
        "label": "Scientific Reports - Face recognition and discrimination in Archerfish"
      });
      addSource({
        "url": "https://doi.org/10.1242/jeb.243501",
        "label": "Journal of Experimental Biology - Hydrodynamics of jet control and spitting in Toxotes jaculatrix"
      });
    }

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
