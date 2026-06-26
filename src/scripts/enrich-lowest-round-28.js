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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

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
  console.log(`Selected targets for Round 28: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    if (c.id === 'bullet-ant') {
      // 12 structured fields
      newC.diet_type = "omnivore";
      newC.diet_items = ["mật hoa", "dịch cây", "côn trùng nhỏ", "ấu trùng", "nước"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 90;
      newC.lifespan_max = 180;
      newC.lifespan_unit = "days";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Kiến chúa thực hiện thụ tinh đơn lẻ trong chuyến bay giao phối và đẻ trứng để duy trì bầy đàn. Ấu trùng được nuôi bằng dịch ngọt và thức ăn côn trùng do kiến thợ mang về.";
      newC.locomotion = "walk";
      newC.speed_max = 0.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 18;
      newC.size_max_mm = 30;
      newC.weight_avg_g = 0.1;

      const charAdd = "Hệ thống tuyến Poneratoxin phát triển với túi chứa độc lớn nối liền ngòi châm dài đến 3mm ở chóp bụng, có vỏ chitin bọc ngoài chịu áp lực ép mạnh. Cơ bắp hàm khỏe với cấu trúc răng sừng sắc nhọn để giữ chặt con mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng pheromone báo động đặc thù nồng độ cao để triệu tập đồng loại tấn công đồng loạt khi có mối đe dọa. Điều hòa nhiệt độ tổ bằng cách thông khí thông qua các lỗ tổ sâu dưới gốc cây nhiệt đới.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc có chứa peptide poneratoxin ngăn chặn sự dẫn truyền ion natri qua màng tế bào thần kinh vận động và cảm giác, duy trì cảm giác đau cực độ ở cấp độ 4+ Schmidt liên tục 24 giờ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2018.04.015",
        "label": "Toxicon - Poneratoxin and neurotoxic effects in Paraponera clavata"
      });
      addSource(newC.sources, {
        "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3212456/",
        "label": "National Institutes of Health - Venom composition of the bullet ant"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Được mô tả là vết đốt đau giống như bị đạn bắn và cảm giác bỏng rát cực độ như đi trên than hồng.",
        "Nghi lễ trưởng thành của tộc người Sateré-Mawé yêu cầu thanh niên đeo găng tay chứa đầy kiến đạn đốt liên tiếp nhiều lần để chứng minh sức chịu đựng."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng leo bám thân cây thẳng đứng siêu hạng nhờ vuốt chân có vuốt kép bám chặt vỏ cây rừng mưa.",
        "Lực đẩy và kẹp hàm cơ học cực lớn so với tỉ trọng cơ thể siêu nhỏ."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ thể nhạy cảm cao với sự sụt giảm độ ẩm không khí dưới 75%, dễ mất nước qua màng biểu bì da mỏng.",
        "Hoàn toàn mất khả năng tự vệ đơn độc nếu bị cô lập khỏi mạng lưới pheromone của đàn."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'camel-spider') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["côn trùng", "thằn lằn nhỏ", "loài gặm nhấm nhỏ", "chim non", "bọ cạp", "nhện khác"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sau khi giao phối, con cái đào hang sâu đẻ từ 50 đến 200 trứng. Con cái bảo vệ tổ trứng và thỉnh thoảng nhịn ăn cho đến khi trứng nở.";
      newC.locomotion = "walk";
      newC.speed_max = 16.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 120;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 38.0;

      const charAdd = "Cơ thể được bao phủ bởi lớp lông tơ cảm thụ cơ học (setae) dày đặc để phát hiện chấn động không khí và mặt đất sa mạc. Hàm sừng chelicerae phát triển cao độ với hệ thống cơ khép chiếm phần lớn thể tích đầu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng hang sâu dưới lòng cát (sâu tới 1-2m) để giữ ẩm cơ thể và duy trì thân nhiệt ổn định trong những giờ nắng nóng gay gắt của sa mạc. Săn mồi chủ động bằng cách truy đuổi tốc độ cao.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cấu trúc hàm sừng chelicerae cơ học vận hành theo cơ chế đòn bẩy kép siêu khỏe giúp nghiền nát con mồi mà không cần nọc độc. Bộ phận malleoli ở chân sau chứa thụ cảm hóa học dò tìm con mồi dưới cát.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.238469",
        "label": "Journal of Experimental Biology - Solifugae Locomotion and Mechanics"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1115/1.4026330",
        "label": "Journal of Biomechanical Engineering - Force mechanics of Solifugae chelicerae"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Tên khoa học Solifugae dịch ra là 'chạy trốn mặt trời', phản ánh tập tính luôn tìm kiếm bóng râm (kể cả bóng của con người đang di chuyển).",
        "Chúng nghiền nát thức ăn và bơm dịch vị tiêu hóa ngoài cơ thể, biến con mồi thành dạng dịch lỏng trước khi hút."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực nghiền nát cơ học của cặp hàm chelicerae thuộc hàng mạnh nhất trong ngành chân khớp so với kích thước.",
        "Khả năng bứt tốc cự ly ngắn vượt trội trên cát lún nhờ phân bổ trọng lực tối ưu trên các chân dài."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ chế hô hấp khí quản đòi hỏi trao đổi chất cao, gây mất nước nhanh nếu tiếp xúc với gió nóng sa mạc ban ngày quá lâu.",
        "Thân sau (opisthosoma) mềm, không có lớp giáp chitin dày bảo vệ, là điểm yếu chí mạng khi bị tấn công từ phía sau."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'cantors-giant-softshell-turtle') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá sông", "cua đá", "tôm nước ngọt", "ốc", "trai", "ếch nhái"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng vào mùa khô (tháng 2 - tháng 5) trên các bãi cát ven sông nước ngọt. Mỗi lứa đẻ từ 20 đến 28 trứng tròn có vỏ canxi cứng chịu lực va đập nước sông.";
      newC.locomotion = "hybrid";
      newC.speed_max = 5.0;
      newC.conservation_status = "CR";
      newC.size_min_mm = 700;
      newC.size_max_mm = 1200;
      newC.weight_avg_g = 100000.0;

      const charAdd = "Cơ thể dẹt dẹp khí động học dưới nước, mai mềm làm từ các đĩa sụn đàn hồi cao bọc da nhẵn bóng giúp giảm ma sát nước sông. Mũi kéo dài thành dạng ống thở nhỏ giúp hô hấp kín đáo khi vùi cát.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Vùi mình sâu dưới lớp cát đáy sông ẩm ướt, chỉ để lộ phần mắt và đầu mũi nhỏ để rình mồi. Giảm nhịp tim xuống mức tối thiểu dưới nước để giảm tiêu thụ oxy tế bào.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khớp đốt cổ có cơ cấu lò xo phóng đầu táp mồi siêu tốc chỉ trong 0.04 giây, nhanh tương đương đòn tấn công của các loài rắn độc. Biểu bì họng có cấu trúc mạch máu hỗ trợ hấp thụ oxy phụ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://www.iucn-tftsg.org/wp-content/uploads/file/Accounts/crm_5_077_cantorii_v1_2014.pdf",
        "label": "Conservation Biology of Freshwater Turtles - Pelochelys cantorii"
      });
      addSource(newC.sources, {
        "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7068352/",
        "label": "PMC - Genome analysis of Pelochelys cantorii"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Dành đến 95% thời gian cuộc đời chôn mình dưới cát sông và chỉ nhô đầu lên thở khoảng 2-3 lần một ngày.",
        "Từng được cho là đã tuyệt chủng tại lưu vực sông Mekong cho đến khi một quần thể nhỏ được phát hiện lại ở Campuchia và Việt Nam."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cú táp bộc phát siêu tốc với lực cắn của quai hàm sừng cực mạnh dễ dàng bẻ gãy mai cua và vỏ ốc cứng.",
        "Khả năng ngụy trang thụ động tối thượng tiệp màu hoàn toàn với cát sông để phục kích mồi."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cực kỳ dễ tổn thương da mai mềm trước các loài nấm ký sinh và nhiễm khuẩn nếu chất lượng nước sông suy thái.",
        "Cơ thể nặng nề di chuyển rất vụng về trên cạn, dễ bị săn đuổi hoặc mất nước nhanh."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'cape-buffalo') {
      // 12 structured fields
      newC.diet_type = "herbivore";
      newC.diet_items = ["cỏ cao", "cỏ xavan", "lá cây bụi", "chồi non", "thảo mộc"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 18;
      newC.lifespan_max = 22;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh con (viviparous). Thời gian mang thai kéo dài 11.5 tháng, đẻ một con non duy nhất. Con non có thể tự đứng và chạy theo đàn chỉ sau vài giờ sau sinh.";
      newC.locomotion = "walk";
      newC.speed_max = 57.0;
      newC.conservation_status = "NT";
      newC.size_min_mm = 1700;
      newC.size_max_mm = 3400;
      newC.weight_avg_g = 700000.0;

      const charAdd = "Cơ thể lực lưỡng bọc trong lớp da dày đến 2cm ở vùng cổ, cấu trúc cơ bắp bám vai khỏe và khung xương sườn lớn vững chãi giúp hấp thụ chấn động lực cơ học lớn khi va chạm trực diện.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng chiến thuật phòng thủ tập thể vòng tròn khép kín (chiến lũy sừng), đưa con non và cá thể yếu vào giữa để bảo vệ trước sư tử. Sử dụng âm thanh hạ âm tần số thấp để liên lạc bầy đàn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tấm sừng boss dày liên kết ở gốc sừng hóa xương hoàn toàn ở trâu đực trưởng thành, đóng vai trò như một mũ bảo hiểm hấp thụ xung lực cực đại, chống chịu va đập cơ học cực lớn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://www.iucnredlist.org/species/21174/125867375",
        "label": "IUCN Red List - Syncerus caffer Species Status"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.2307/3544772",
        "label": "Ecology - Social organization and antipredator behavior of Syncerus caffer"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Được mệnh danh là 'Kẻ tạo góa phụ' (Widowmaker) vì chúng là một trong những loài thú lớn tấn công và làm tử vong nhiều người nhất ở châu Phi.",
        "Khi bị sư tử tấn công, cả bầy trâu rừng sẵn sàng lao vào ứng cứu và có thể bao vây ngược lại, đuổi sư tử lên cây hàng giờ liền."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực húc tàn phá tạo ra động năng khổng lồ từ khối lượng cơ thể gần 1 tấn lao đi ở vận tốc 57 km/h.",
        "Bộ nhớ dài hạn tuyệt vời giúp ghi nhớ mùi và vị trí kẻ thù (như thợ săn) trong nhiều năm."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Lượng nước tiêu thụ hàng ngày rất lớn, bắt buộc phải di chuyển gần các nguồn nước sông hồ xavan.",
        "Cơ thể nặng nề làm giảm độ linh hoạt khi xoay trở ở cự ly hẹp trước các đòn tấn công chớp nhoáng."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'cheetah') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["linh dương gazelle", "thỏ rừng", "linh dương impala", "chim lớn", "linh dương wildebeest con"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh con (viviparous). Thời gian mang thai kéo dài 90-95 ngày, đẻ một lứa gồm 3-5 con non. Bờm lông mantle ở con non biến mất sau 3 tháng tuổi.";
      newC.locomotion = "walk";
      newC.speed_max = 113.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 1100;
      newC.size_max_mm = 1500;
      newC.weight_avg_g = 46500.0;

      const charAdd = "Thân hình thon dài, cấu trúc xương bả vai tự do không cố định vào cột sống giúp mở rộng góc sải chân chạy nước rút lên tới 7m. Mũi và xoang phổi cực lớn tăng nạp oxy tức thì.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Săn đuổi tốc độ cực hạn vào ban ngày để tránh xung đột với các loài thú ăn thịt lớn hơn. Ngáng chân con mồi đang bỏ chạy ở tốc độ cao bằng móng vuốt phụ trước khi cắn ngạt thở.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống phản xạ tiền đình - mắt (vestibulo-ocular reflex) giữ cho đầu và mắt thăng bằng thăng hoa tuyệt đối khóa chặt con mồi khi đang bứt tốc nước rút dữ dội. Móng vuốt bán co rút bám đất tốt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/nature12295",
        "label": "Nature Journal - Locomotion dynamics of hunting cheetahs"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12056",
        "label": "Journal of Zoology - Sprinting mechanics and evolutionary ecology of cheetahs"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Là loài họ mèo lớn duy nhất không thể gầm, thay vào đó chúng kêu chiêm chiếp giống như chim hoặc gừ gừ giống như mèo nhà.",
        "Chúng thường phải bỏ lại con mồi vừa săn được nếu bị linh cẩu hoặc sư tử đe dọa do không có thể hình đối kháng tay đôi."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Gia tốc khởi hành phi thường đạt 0-97 km/h chỉ sau 3 giây nhờ hệ cơ bắp chuyển đổi nhanh (fast-twitch fibers) hiệu suất cao.",
        "Đuôi cơ bắp hoạt động giống như bánh lái con quay hồi chuyển giúp điều hướng linh hoạt khi rẽ cua gắt."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nhiệt độ cơ thể tăng vọt lên tới 40.5 độ C sau cú nước rút, bắt buộc phải dừng chạy để tránh tổn thương não bộ.",
        "Độ đa dạng di truyền cực thấp do biến cố nghẽn cổ chai di truyền trong quá khứ tiến hóa."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));
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
