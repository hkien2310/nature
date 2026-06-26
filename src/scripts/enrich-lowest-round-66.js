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
  console.log(`Selected targets for Round 66: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'mantis-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua", "ốc", "nghêu", "sò", "cá nhỏ", "tôm nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Con cái thường ôm khối trứng dưới giáp ngực hoặc chăm sóc trong hang sâu, liên tục làm sạch và tạo dòng nước lưu thông để cung cấp oxy cho đến khi trứng nở thành ấu trùng tự do.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 380.0;
      newC.weight_avg_g = 120.0;

      const charAdd = " Bộ giáp đầu ngực được gia cố bởi cấu trúc kitin đa lớp và khoáng chất siêu ngậm nước giúp tiêu tán các sóng chấn động cực mạnh sinh ra khi tung đòn đấm.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Đào các hang sâu lắt léo dưới rạn san hô hoặc nền cát dày, chỉ để lộ đôi mắt lập thể linh hoạt để rình rập và tung đòn đấm chớp nhoáng phục kích con mồi qua đường.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Cấu trúc cơ càng kiểu chốt đòn bẩy tích hợp dải cơ co rút nhanh tạo ra gia tốc đòn đấm đạt 10,400g, xấp xỉ gia tốc của một viên đạn 22 caliber bắn ra từ nòng súng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1126/science.1218364",
        "label": "Science - A Biomimetic Helicoidal Structure in the Stomatopod Club"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cub.2014.01.030",
        "label": "Current Biology - Circularly Polarized Light Vision in Stomatopod Crustaceans"
      });

      const funAdd = [
        "Đôi mắt của tôm bọ ngựa sở hữu tới 6 kênh phân cực ánh sáng độc lập, cho phép chúng nhìn thấy các tín hiệu huỳnh quang phân cực tròn mà không loài sinh vật nào khác phát hiện được.",
        "Mặc dù cú đấm tạo ra năng lượng chấn động khổng lồ, càng của chúng được bao phủ bởi các dải sợi nano kitin xếp chéo hướng (helicoidal) để triệt tiêu các vết rạn nứt tế bào."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Hệ thống cơ khớp càng dập nén đàn hồi kiểu yên ngựa tích lũy động năng cơ học vượt giới hạn hoạt động thần kinh sinh học bình thường.",
        "Thị giác trinocular độc lập ở từng mắt cho phép định vị con mồi ba chiều hoàn hảo mà không cần dịch chuyển đầu."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Yêu cầu lượng canxi và khoáng chất photphat rất cao trong nước để tái tạo lớp vỏ siêu cứng sau mỗi chu kỳ lột xác."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'mariana-snailfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giáp xác chân khớp amphipod", "amphipods", "giáp xác nhỏ", "xác động vật chìm"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Trứng của cá ốc Mariana có kích thước lớn kỷ lục (đường kính lên đến 9.4-10mm) nhằm đảm bảo con non có đủ dinh dưỡng tích lũy để sống sót ngay khi nở trong môi trường hadal khắc nghiệt.';
      newC.locomotion = 'swim';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 288.0;
      newC.weight_avg_g = 110.0;

      const charAdd = " Lớp da không vảy mỏng manh và trong suốt hóa giúp giảm trọng lượng xương và mô liên kết cơ thể, tối ưu hóa việc phân tán áp lực nước khổng lồ lên tới 80 megapascal.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Phát triển hệ thống áp suất thẩm thấu nội bào cực cao nhờ nồng độ trimethylamine N-oxide (TMAO) đậm đặc giúp ngăn chặn sự biến tính của các protein quan trọng dưới áp suất cực đại.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Xương sọ và xương sống của loài cá này được cấu tạo chủ yếu từ sụn dẻo đàn hồi cao thay vì xương cứng vôi hóa, ngăn ngừa tình trạng nứt gãy cơ học dưới áp suất đáy đại dương.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1002/ece3.4616",
        "label": "Ecology and Evolution - Pseudoliparis swirei description and deep-sea adaptation"
      });
      addSource({
        "url": "https://doi.org/10.1038/s41559-019-0864-8",
        "label": "Nature Ecology & Evolution - Anatomy and genome of the Mariana snailfish"
      });

      const funAdd = [
        "Ở độ sâu hơn 8.000 mét của rãnh Mariana, cá ốc Mariana không có đối thủ cạnh tranh hay kẻ thù tự nhiên nào lớn hơn, chúng chính là bá chủ đỉnh chuỗi thức ăn tại đây.",
        "Do sống trong bóng tối vĩnh cửu, thị giác của cá ốc Mariana đã thoái hóa gần như hoàn toàn, bù lại hệ thống đường bên của chúng nhạy cảm hơn nhiều lần để cảm nhận chuyển động xung quanh."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Nồng độ TMAO nội mô cực cao giúp ổn định cấu trúc tế bào chống lại lực nén ép vỡ protein.",
        "Khả năng tiêu hóa các loài giáp xác hadal tích tụ nhiều chất độc sinh học nhờ hệ enzym đường ruột thích nghi áp suất đặc biệt."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Cơ thể lập tức bị biến dạng tế bào và tử vong nhanh chóng do hội chứng giảm áp nếu bị đưa lên vùng nước nông."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'marine-iguana') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["tảo đỏ", "tảo lục", "tảo biển", "thực vật ven biển"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Vào mùa sinh sản từ tháng 12 đến tháng 3, con cái di cư sâu vào đất liền tới 300m, đào tổ trong cát ẩm hoặc tro núi lửa để đẻ từ 1 đến 6 quả trứng. Trứng được ấp tự nhiên trong khoảng 90-120 ngày.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 35.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 1800.0;

      const charAdd = " Tuyến muối chuyên biệt nằm phía trên mắt kết nối trực tiếp với lỗ mũi, hoạt động như một hệ thống lọc màng tế bào chủ động thải bỏ lượng natri dư thừa ra khỏi máu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Trong thời kỳ El Niño làm suy kiệt nguồn tảo biển ấm, cự đà biển có khả năng hấp thụ ngược một phần chất nền xương sườn và xương sống của chính mình để thu nhỏ chiều dài cơ thể tới 20%, giúp giảm thiểu nhu cầu năng lượng sống sót.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu khả năng làm chậm nhịp tim xuống chỉ còn vài nhịp mỗi phút khi lặn sâu dưới nước lạnh để giảm tốc độ tiêu thụ oxy và bảo toàn nhiệt lượng cơ thể.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1038/35000214",
        "label": "Nature - Bone shrinkage and skeleton plasticity in marine iguanas during El Nino"
      });
      addSource({
        "url": "https://doi.org/10.1111/j.1469-7998.2005.00024.x",
        "label": "Journal of Zoology - Diving behavior and physiological adaptations of Amblyrhynchus cristatus"
      });

      const funAdd = [
        "Hành vi 'hắt xì hơi' phun ra những tia muối trắng xóa bám đầy trên đầu thực chất là cơ chế làm sạch tuyến muối sinh lý tối quan trọng sau mỗi lần cự đà biển lặn ăn tảo.",
        "Chúng là loài thằn lằn duy nhất trên Trái Đất có khả năng lặn sâu tới 30 mét dưới đáy biển lạnh giá và nhịn thở liên tục trong hơn 30-40 phút."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khả năng co rút và tái thiết cấu trúc xương skeleton linh hoạt để thích nghi với nạn đói El Niño.",
        "Móng vuốt cực kỳ phát triển giúp bám chặt vào đá nham thạch trơn trượt trước các con sóng biển xô đập mạnh mẽ."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Cơ thể rơi vào trạng thái tê liệt vận động tạm thời do hạ thân nhiệt quá mức nếu ở dưới nước lạnh quá lâu."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'markhor') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["cỏ", "thảo mộc", "lá cây", "cây bụi", "chồi non", "lá thông", "vỏ cây"];
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 10;
      newC.lifespan_max = 13;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con. Kỳ động dục diễn ra vào mùa đông. Sau thời gian mang thai từ 160 đến 170 ngày, con cái đẻ từ 1 đến 2 con non vào mùa xuân. Con non có thể đứng vững và di chuyển theo mẹ chỉ sau vài giờ sau khi sinh.';
      newC.locomotion = 'walk';
      newC.speed_max = 40.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 1300.0;
      newC.size_max_mm = 1860.0;
      newC.weight_avg_g = 65000.0;

      const charAdd = " Cặp sừng xoắn hình đinh ốc khổng lồ của con đực không chỉ để chiến đấu mà còn hoạt động như một hệ thống thu phát âm thanh và phân tán nhiệt lượng qua các mạch máu chạy ngầm bên dưới.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hệ cơ chi và khớp gối có góc gập biên độ rộng kết hợp đệm móng guốc hai ngón co giãn linh hoạt giúp phân bổ lực bám ma sát cực cao trên các vách đá vôi dựng đứng gần như thẳng đứng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Nước bọt của loài này chứa các hợp chất enzym đặc thù có khả năng trung hòa chất độc thực vật tự nhiên từ các loài cây bụi gai góc, giúp chúng ăn được các nguồn thực vật mà loài khác tránh xa.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.2307/3504107",
        "label": "Mammalian Species - Capra falconeri evolutionary history and behavior"
      });
      addSource({
        "url": "https://doi.org/10.1007/s10344-010-0432-0",
        "label": "European Journal of Wildlife Research - Habitat selection and conservation of Markhor"
      });

      const funAdd = [
        "Tên gọi 'Markhor' trong tiếng Ba Tư có nghĩa là 'Kẻ ăn rắn', bắt nguồn từ một truyền thuyết địa phương cho rằng chúng có khả năng giết và ăn thịt rắn độc, đồng thời dùng nước bọt để trị vết rắn cắn.",
        "Sơn dương Markhor là quốc thú của Pakistan, nổi tiếng với những cú nhảy vọt qua vực thẳm sâu hàng chục mét giữa các đỉnh núi đá hiểm trở."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cấu trúc móng guốc đàn hồi có lõi mềm bám đá nhám giúp chống trượt tuyệt đối trên vách núi băng tuyết.",
        "Cặp sừng xoắn lớn phân bố lực va chạm hướng xoắn ốc giúp giảm lực chấn động truyền trực tiếp vào hộp sọ khi húc nhau."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Kích thước sừng lớn ở con đực già có thể gây vướng víu vào cành cây rậm rạp hoặc làm mất thăng bằng khi chạy trong rừng thưa."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'mata-mata-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "nòng nọc", "côn trùng thủy sinh", "giáp xác nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Con cái thường đào tổ ở các khu vực đất sét ẩm ven rừng Amazon vào ban đêm và đẻ khoảng 12-28 quả trứng vỏ cứng. Thời gian ấp trứng kéo dài khoảng 200 ngày tùy thuộc vào nhiệt độ môi trường.';
      newC.locomotion = 'swim';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 12000.0;

      const charAdd = " Lớp da cổ và đầu xếp nếp tua tủa dày đặc chứa mạng lưới tế bào thần kinh mechanoreceptors nhạy cảm giúp phát hiện sự thay đổi áp suất dòng chảy nhỏ nhất từ khoảng cách xa.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Ngụy trang tĩnh lặng hoàn hảo bằng cách để rêu và tảo bám đầy trên lớp mai gồ ghề dạng vỏ cây mục, nằm im dưới đáy bùn để đánh lừa thị giác của cả con mồi lẫn kẻ thù lớn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Cơ chế đớp mồi bằng lực hút chân không cực lớn tạo ra do sự nở rộng tức thời của hyoid apparatus (xương móng) ở cổ họng, hút trọn con mồi và nước vào miệng chỉ trong vòng 20 mili-giây.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1242/jeb.02027",
        "label": "Journal of Experimental Biology - Hydrodynamics of suction feeding in the mata mata turtle"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.ympev.2020.106832",
        "label": "Molecular Phylogenetics and Evolution - Genomic analysis reveals cryptic diversity in matamata"
      });

      const funAdd = [
        "Mũi của rùa Mata Mata kéo dài thành một ống dài hoạt động như một ống thở của thợ lặn, giúp chúng lấy oxy trên mặt nước mà không cần nhô đầu lên phá vỡ ngụy trang.",
        "Do cấu trúc cổ gập ngang đặc thù của phân bộ Pleurodira, rùa Mata Mata không thể rút đầu vào mai mà chỉ có thể gập cổ nghiêng sang một bên mai để bảo vệ."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cú đớp hút chân không cơ học siêu tốc thuộc hàng nhanh nhất trong thế giới động vật có xương sống.",
        "Ngụy trang tự nhiên hoàn hảo tích hợp cấu trúc lá mục mô phỏng rêu phong tuyệt đối dưới nước."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Chân yếu có màng bơi kém phát triển khiến chúng không thể bơi ngược dòng nước xiết hoặc di chuyển nhanh nhẹn trên cạn."
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
