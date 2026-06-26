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

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

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
  console.log(`Selected targets for Round 61: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    if (c.id === 'brazilian-wandering-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng lớn", "dế", "gián", "ếch nhỏ", "thằn lằn nhỏ", "chuột nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Giao phối hữu tính phức tạp. Nhện cái đẻ từ 1 đến 4 bọc trứng tơ (mỗi bọc chứa khoảng 500-1000 trứng). Nhện cái có hành vi bảo vệ bọc trứng hung dữ cho đến khi nhện con nở.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 8.0;

      const charAdd = " Hệ thống lông cảm thụ cơ học trichobothria dày đặc trên các chi giúp cảm nhận rung động của con mồi hoặc mối đe dọa ở khoảng cách xa.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi đối mặt với mối đe dọa, nhện dựng đứng hai cặp chân trước, để lộ lông màu đỏ tươi ở hàm sừng (chelicerae) và lắc lư cơ thể để đe dọa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sử dụng tơ nhện dẻo dai làm bọc trứng bảo vệ con non và tạo một lớp thảm tơ mỏng làm đệm định vị trước khi ngủ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00359-009-0475-4",
        "label": "Journal of Comparative Physiology A - Visual system and behavior of Phoneutria"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/zoj.12211",
        "label": "Zoological Journal of the Linnean Society - Systematics of Phoneutria"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Tơ nhện của loài này chứa các protein đặc biệt có tính kháng khuẩn cao, ngăn ngừa nấm mốc phân hủy bọc trứng.",
        "Nhện con mới nở có thể phân tán bằng cách leo lên ngọn cây cao và phóng một sợi tơ nhỏ để bay theo gió (ballooning)."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Phản xạ săn mồi chớp nhoáng với cơ chế bứt tốc đột ngột trong phạm vi ngắn.",
        "Khả năng leo bám hoàn hảo nhờ lớp lông chân đệm bám dính scopulae."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nhạy cảm cao với sự mất nước khi nhiệt độ môi trường tăng quá 35 độ C.",
        "Tỉ lệ sống sót của nhện con rất thấp trong tự nhiên do bị ăn thịt đồng loại."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bull-shark') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá", "cá mập nhỏ", "cá đuối", "rùa biển", "chim biển", "động vật có vú dưới nước", "giáp xác"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 12;
      newC.lifespan_max = 16;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con (viviparous). Thời gian mang thai từ 10 đến 11 tháng. Cá mẹ thường bơi vào vùng nước lợ hoặc cửa sông nông, an toàn để đẻ từ 1 đến 13 con non nhằm tránh các loài cá mập lớn khác ăn thịt.';
      newC.locomotion = 'swim';
      newC.speed_max = 40.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 2100.0;
      newC.size_max_mm = 3400.0;
      newC.weight_avg_g = 130000.0;

      const charAdd = " Cơ thể dày, chắc nịch với vây ngực lớn, phẳng tạo lực nâng tối đa khi di chuyển chậm ở vùng nước nông.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Thận và các tuyến đặc biệt ở trực tràng có khả năng tái hấp thụ urê và muối natri clorua để cân bằng áp suất thẩm thấu khi chuyển giữa nước mặn và nước ngọt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến giáp phát triển mạnh giúp cá mập bò điều chỉnh hoạt động trao đổi chất khi thích nghi đột ngột với nồng độ muối thay đổi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0003058",
        "label": "PLOS ONE - Bull shark migration and habitat connectivity"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00227-015-2632-4",
        "label": "Marine Biology - Trophic ecology of euryhaline bull sharks"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cá mập bò có mức nồng độ hormone testosterone tự nhiên cực cao, giải thích cho tập tính săn mồi hung hãn của loài này.",
        "Cá mập bò con sinh ra ở cửa sông đã có khả năng điều hòa áp suất thẩm thấu hoàn chỉnh ngay lập tức."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực cắn tuyệt đối mạnh nhất trong số tất cả các loài cá mập sụn hiện đại khi so sánh cùng kích thước cơ thể.",
        "Hệ thống điện cảm thụ (Ampullae of Lorenzini) siêu nhạy phát hiện xung điện cơ bắp của con mồi trong nước đục."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Khả năng bơi lội bị giảm hiệu suất ở tầng nước siêu sâu do thiếu bong bóng cá thích nghi áp suất cao.",
        "Thường xuyên phải đối mặt với nguy cơ tích tụ độc tố kim loại nặng do đứng đầu chuỗi thức ăn ở cửa sông gần khu dân cư."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bullet-ant') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật hoa", "nhựa cây", "côn trùng nhỏ", "ấu trùng", "nhện nhỏ", "giáp xác nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Hệ thống phân cấp xã hội kiến nghiêm ngặt. Chỉ có kiến chúa sinh sản hữu tính với kiến đực trong chuyến bay hôn phối. Kiến thợ là con cái vô sinh chịu trách nhiệm kiếm ăn và chăm sóc ấu trùng.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 18.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 0.05;

      const charAdd = " Lớp vỏ chitin siêu dày bao phủ toàn bộ cơ thể màu đen mun giúp giảm thiểu tối đa các chấn thương cơ học từ cú rơi từ tán rừng xuống đất.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp kẻ thù đe dọa, chúng cọ xát cơ quan phát thanh ở bụng (stridulatory organ) tạo ra âm thanh rít chói tai để cảnh báo trước khi đốt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Kiến đạn chúa có khả năng điều tiết sinh sản của cả tổ thông qua các pheromone độc quyền tiết ra từ biểu bì da.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00040-004-0756-x",
        "label": "Insectes Sociaux - Foraging behavior and nectar feeding in Paraponera clavata"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/ee/22.4.872",
        "label": "Environmental Entomology - Nesting habits and colony composition of Paraponera clavata"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Bộ tộc Sateré-Mawé ở Brazil sử dụng kiến đạn trong nghi lễ trưởng thành, nơi các chàng trai trẻ phải đeo găng tay chứa hàng chục con kiến đạn đốt trong 10 phút.",
        "Âm thanh cọ xát stridulation của kiến đạn không chỉ cảnh báo kẻ thù mà còn cảnh báo đồng đội về nguồn thức ăn lớn hoặc nguy hiểm."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Quai hàm sừng (mandible) cực khỏe có cấu trúc răng cưa giúp cắt nhỏ con mồi hoặc kẹp chặt đối thủ vững vàng.",
        "Độc tố Poneratoxin có liên kết ion cực bền với kênh ion Natri, làm trì hoãn quá trình khử cực tế bào thần kinh, kéo dài cảm giác đau đớn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Kích thước cơ thể đơn lẻ nhỏ bé và dễ bị cô lập khi hoạt động ngoài phạm vi phối hợp của bầy đàn.",
        "Nhạy cảm với sự sụt giảm độ ẩm không khí của tầng dưới tán rừng rậm nhiệt đới, gây suy giảm khả năng hô hấp qua lỗ thở."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'camel-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng sa mạc", "bọ cánh cứng", "thằn lằn sa mạc", "chuột nhỏ", "chim nhỏ", "bọ cạp", "nhện khác"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Giao phối hữu tính. Con đực tiếp cận con cái bằng cách vuốt ve xúc giác để làm yên dịu con cái, sau đó chuyển túi tinh bằng kìm sừng chelicerae vào lỗ sinh dục của con cái. Con cái đào hang đẻ từ 50 đến 200 trứng.';
      newC.locomotion = 'walk';
      newC.speed_max = 16.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 20.0;

      const charAdd = " Lông trichobothria cực kỳ mảnh phủ kín các đốt chân sau đóng vai trò như các cảm biến khí lưu phát hiện sự dịch chuyển của các luồng khí mỏng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi đối mặt với nhiệt độ khắc nghiệt giữa trưa sa mạc, chúng hạ thấp cơ thể xuống nền cát ẩm trong hang để hấp thụ nhiệt thụ động từ thành hang.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống kìm sừng chelicerae chuyển động độc lập phối hợp với răng cưa sắc nhọn cho phép chúng nghiền nát xương của các loài bò sát nhỏ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.3956/2012-40.1",
        "label": "Journal of Arachnology - Prey capture behavior and feeding mechanisms in Solifugae"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/j.1469-7998.2010.00762.x",
        "label": "Journal of Zoology - Metabolic rates and thermal ecology of desert solifuges"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Tên 'nhện lạc đà' bắt nguồn từ niềm tin sai lầm của người bản địa rằng chúng bò vào bụng lạc đà để đẻ trứng hoặc ăn thịt, thực tế chúng chỉ tìm bóng râm của lạc đà.",
        "Mặc dù trông hung tợn và có hàm sừng lớn, nhện lạc đà hoàn toàn không có nọc độc và không gây nguy hiểm chết người cho con người."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tốc độ di chuyển bứt phá cực nhanh trên cát giúp chúng bắt kịp các con mồi di chuyển nhanh nhất hoang mạc.",
        "Cơ chế tiêu hóa ngoài cơ thể bằng enzyme protease cực mạnh giúp đẩy nhanh thời gian hấp thụ chất dinh dưỡng."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không có tuyến tơ để tạo lưới phòng thủ hoặc giữ chặt con mồi thụ động.",
        "Lớp cutin bảo vệ cơ thể mỏng khiến chúng dễ bị mất nước nhanh chóng nếu bị kẹt ngoài nắng gắt sa mạc mà không có bóng râm."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'cantors-giant-softshell-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá sông", "cua đá", "tôm nước ngọt", "ốc", "sò", "động vật lưỡng cư nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Vào mùa sinh sản (từ tháng 2 đến tháng 4), con cái lên các bãi cát ven sông để đào tổ và đẻ từ 20 đến 28 quả trứng mai cứng. Trứng tự nở nhờ nhiệt độ mặt cát sau khoảng 60 ngày.';
      newC.locomotion = 'swim';
      newC.speed_max = 8.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 700.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 45000.0;

      const charAdd = " Da mai mềm chứa các mô liên kết collagen dày đặc, giúp chống lại lực xé từ dòng nước lũ chảy xiết ở các con sông lớn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chúng sử dụng ống mũi thuôn dài như chiếc ống thở để lấy không khí từ trên mặt nước mà không cần di chuyển thân mình khỏi cát bảo vệ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Đĩa sụn dẻo ở rìa mai mềm hoạt động như bánh lái phụ trợ giúp cân bằng độ sâu khi bơi lội chống dòng chảy xiết.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.2984/64.3.387",
        "label": "Pacific Science - Ecology and conservation status of Pelochelys cantorii"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1002/ece3.8762",
        "label": "Ecology and Evolution - Genetic diversity and population structure of Pelochelys cantorii"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù có mai mềm nhẵn nhìn giống một chiếc bánh lớn, chúng là một trong những loài rùa nước ngọt hung dữ nhất khi bị quấy rối.",
        "Lớp da nhẵn bao phủ toàn bộ cơ thể giúp chúng giảm thiểu tối đa tiếng động và lực cản của nước khi di chuyển áp sát lòng sông."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lớp đệm collagen dưới da mai mềm giúp hấp thụ và triệt tiêu tới 70% phản lực từ các cú va chạm đá ngầm dưới đáy sông.",
        "Hệ cơ cổ cực kỳ linh hoạt cho phép chúng xoay đầu cắn ngược về phía sau mà không cần xoay chuyển cơ thể."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ cấu hô hấp phụ qua da mai mềm khiến chúng dễ bị nhiễm độc sinh học trực tiếp từ các hóa chất hòa tan trong nước sông.",
        "Vùng da ẩm ướt ở mai rất nhạy cảm với các loại nấm ký sinh nếu lòng cát sông bị bồi lắng phù sa quá mức."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
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
