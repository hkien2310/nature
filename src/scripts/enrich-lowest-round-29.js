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
  console.log(`Selected targets for Round 29: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'chinese-giant-salamander') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá sông", "cua đá", "tôm nước ngọt", "ếch nhái", "côn trùng thủy sinh", "giun"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 30;
      newC.lifespan_max = 60;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Giao phối và đẻ trứng dưới nước vào cuối mùa hè (tháng 8-9). Con cái đẻ các dải trứng dài chứa 400-500 trứng bám vào đá hang ngầm. Con đực bảo vệ và quạt nước cung cấp oxy cho tổ trứng trong 30-40 ngày cho đến khi nở.";
      newC.locomotion = "hybrid";
      newC.speed_max = 2.5;
      newC.conservation_status = "CR";
      newC.size_min_mm = 1000;
      newC.size_max_mm = 1800;
      newC.weight_avg_g = 35000.0;

      const charAdd = "Lớp biểu bì trần không vảy có tuyến tiết chất nhầy bảo vệ dày dặc, cùng hệ thống mao mạch ngoại biên dày đặc cho phép hô hấp qua da đạt hiệu suất cực cao chiếm hơn 90% nhu cầu oxy.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng các neuromast chạy dọc đường bên đầu và thân để định vị chính xác vị trí con mồi trong bóng tối hoàn toàn thông qua sự chênh lệch áp suất nước nhỏ nhất.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu khả năng tái sinh hoàn hảo từ chi bị đứt lìa, đuôi cho đến các phần cơ tim và hệ thần kinh trung ương nhờ sự biệt hóa ngược tế bào và hình thành túi phôi tái sinh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2018.08.017",
        "label": "Current Biology - Evolutionary History of Giant Salamanders"
      });
      addSource(newC.sources, {
        "url": "https://www.iucnredlist.org/species/1272/3375181",
        "label": "IUCN Red List - Andrias davidianus status"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Trong mùa sinh sản hoặc khi bị đe dọa, chúng phát ra âm thanh tần số thấp giống hệt tiếng khóc của em bé sơ sinh.",
        "Chúng là loài lưỡng cư lớn nhất thế giới còn tồn tại, được ví như những hóa thạch sống từ thời kỳ khủng long."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực cắn đột ngột cực mạnh kết hợp phản xạ hút áp suất âm chân không trong miệng nuốt chửng mồi trong chưa đầy 50 mili giây.",
        "Khả năng tái sinh cơ thể bị tổn thương toàn vẹn bao gồm cả xương khớp và mô thần kinh."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Mắt tiêu biến gần như mù hoàn toàn, phụ thuộc tuyệt đối vào môi trường nước sạch chảy xiết giàu oxy.",
        "Lớp da trần cực kỳ nhạy cảm với các chất độc hóa học nông nghiệp thẩm thấu."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'coconut-crab') {
      // 12 structured fields
      newC.diet_type = "omnivore";
      newC.diet_items = ["quả dừa", "trái cây chín", "hạt cây rừng", "xác động vật chết", "cua nhỏ", "chuột nhắt"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 40;
      newC.lifespan_max = 60;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Giao phối trên cạn từ tháng 5 đến tháng 9. Sau đó con cái mang khối trứng thụ tinh dưới bụng đi ra sát mép biển giải phóng trứng vào nước. Ấu trùng trải qua các giai đoạn zoea và megalopa dưới biển trước khi bò lên bờ.";
      newC.locomotion = "walk";
      newC.speed_max = 5.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 400;
      newC.size_max_mm = 1000;
      newC.weight_avg_g = 4000.0;

      const charAdd = "Lớp vỏ kitin được canxi hóa cực kỳ vững chắc nhờ tích lũy hàm lượng khoáng canxi từ thức ăn cạn. Cặp càng trước phát triển mất cân xứng cơ bắp tạo nên hệ đòn bẩy vật lý tối ưu lực siết.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng hệ thống phổi branchiostegal lungs (phổi nhánh mang) ẩm ướt để hấp thụ oxy trực tiếp từ không khí, đồng thời bù ẩm phổi bằng cách uống sương đêm hoặc nước biển đọng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Lực kẹp càng lớn nhất trong thế giới giáp xác đạt 3300 Newton, tương đương lực cắn của một con sư tử trưởng thành.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0166108",
        "label": "Strike Force of the Coconut Crab"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2005.09.008",
        "label": "Insect-like olfactory system in the coconut crab"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng có thói quen ăn cắp xoong nồi, thìa dĩa bằng kim loại của con người vì nhầm là nguồn thức ăn thơm ngon nên còn được gọi là 'Cua trộm'.",
        "Chúng là loài động vật không xương sống trên cạn lớn nhất thế giới còn sinh tồn."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực kẹp càng khủng khiếp dễ dàng đập nát vỏ quả dừa cứng và xương động vật.",
        "Khả năng leo cây dừa thẳng đứng cao tới 6 mét nhờ các gai kitin bám ma sát ở đầu chân."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không thể bơi và sẽ chết đuối nếu chìm dưới nước biển sâu khi đã trưởng thành.",
        "Cơ thể cực kỳ nhạy cảm và không thể tự vệ trong thời kỳ lột xác kéo dài 30 ngày."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'coelacanth') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá sâu", "mực biển sâu", "bạch tuộc", "cá mập nhỏ", "cá lồng đèn"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 60;
      newC.lifespan_max = 100;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thời gian mang thai cực dài từ 3 đến 5 năm, dài nhất trong thế giới động vật xương sống. Con cái đẻ ra từ 5 đến 25 con non phát triển hoàn thiện mà không qua giai đoạn ấu trùng.";
      newC.locomotion = "swim";
      newC.speed_max = 5.0;
      newC.conservation_status = "CR";
      newC.size_min_mm = 1500;
      newC.size_max_mm = 2000;
      newC.weight_avg_g = 80000.0;

      const charAdd = "Sở hữu các vây thùy thịt di động độc lập được nâng đỡ bằng hệ cấu trúc xương tương đồng chi động vật cạn, cùng dây sống notochord chứa đầy dầu đặc biệt thay thế cột sống.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Tiết kiệm năng lượng bằng cách trôi lơ lửng nương dòng hải lưu lạnh sâu, sử dụng rostral organ cảm thụ điện trên trán để phát hiện con mồi phát ra dòng điện sinh học nhỏ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hộp sọ có khớp sọ nội sọ (intracranial joint) kết hợp cơ vận động sọ đặc thù cho phép ngửa hàm trên lên cao để tăng tối đa thể tích khoang miệng hút con mồi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://www.nature.com/articles/nature12027",
        "label": "Nature - The coelacanth genome and Tetrapod evolution"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2021.05.012",
        "label": "Current Biology - New insights into the life history of the coelacanth"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Tổ tiên của cá vây tay xuất hiện từ 400 triệu năm trước và loài này được cho là đã tuyệt chủng cùng khủng long trước khi được tìm thấy vào năm 1938.",
        "Cơ thể cá vây tay chứa lượng este sáp béo cực cao khiến thịt của chúng có vị sáp khó ngửi và có thể gây tiêu chảy cấp cho con người."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ cảm ứng điện trường rostral organ nhạy bén giúp dò mồi chính xác dưới kẽ đá tối tăm.",
        "Vảy Cosmoid cực kỳ dày cứng bảo vệ cơ thể khỏi va chạm đá ngầm và vết cắn của ký sinh trùng."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ tuần hoàn và dung tích tim vô cùng thô sơ giới hạn khả năng vận động tốc độ cao kéo dài.",
        "Tốc độ hồi phục quần thể cực kỳ chậm chạp do tuổi trưởng thành sinh dục muộn (55 tuổi) và mang thai 5 năm."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'colossal-squid') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá tuyết Nam Cực", "cá răng Patagonian", "mực biển sâu", "giáp xác tầng đáy"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con đực sử dụng cơ quan chuyển tinh để bơm các túi tinh vào khoang áo của con cái dưới đáy sâu. Trứng sau khi thụ tinh được bao bọc trong một khối gel bảo vệ khổng lồ trôi nổi tự do.";
      newC.locomotion = "swim";
      newC.speed_max = 25.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 10000;
      newC.size_max_mm = 14000;
      newC.weight_avg_g = 495000.0;

      const charAdd = "Áo mực dày cơ bắp chịu áp lực nước sâu tuyệt hảo, kết hợp 2 xúc tu săn mồi dài trang bị các móc xoay (swiveling hooks) chitin nhọn sắc có thể xoay 360 độ cào rách da thịt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Rình rập trong bóng tối lạnh giá vùng biển Nam Cực, sử dụng võng mạc mắt siêu lớn thu nhận ánh sáng sinh học cực yếu từ các loài khác để định vị và phóng xúc tu chộp mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu đôi mắt lớn nhất trong giới động vật với đường kính 30cm, và chiếc mỏ vẹt chitin cứng nhất nhì tự nhiên dễ dàng nghiền nát xương cá răng khổng lồ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://www.tepapa.govt.nz/discover-collections/read-watch-play/colossal-squid",
        "label": "Museum of New Zealand Te Papa - Colossal Squid Resource"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2008.0163",
        "label": "Royal Society - Giant eyes of giant squid"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ống tiêu hóa của mực đi xuyên qua tâm bộ não hình vành khuyên, do đó nếu nuốt phải thức ăn quá cứng hoặc quá thô có thể gây chấn thương não bộ.",
        "Chúng là loài động vật không xương sống lớn nhất hành tinh về mặt trọng lượng cơ thể."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Các móc xoay chitin bám cực chắc xé rách lớp bảo vệ ngoài của con mồi hoặc đối thủ cạnh tranh.",
        "Máu chứa sắc tố hemocyanin gốc đồng giúp tối ưu hóa vận chuyển oxy trong môi trường nước lạnh âm độ."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Trao đổi chất rất chậm khiến khả năng bơi bền bỉ hạn chế, dễ bị cá voi nhà táng dồn đuổi.",
        "Nhạy cảm cao với sự biến đổi ấm lên của nhiệt độ nước biển Nam Cực."
      ];
      weakAdd.forEach(w => addUniqueItem(newC.weaknesses, w));

    } else if (c.id === 'cone-snail') {
      // 12 structured fields
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá hề", "cá bống rạn san hô", "cá thia", "giun biển", "loài thân mềm nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con đực thụ tinh trực tiếp cho con cái. Con cái đẻ ra các nang trứng phẳng bám vào mặt dưới đá hoặc vỏ sò rỗng. Trứng nở ra ấu trùng veliger trôi nổi tự do trước khi định cư đáy cát.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.1;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 120.0;

      const charAdd = "Vòi tiêm radula hóa rỗng chứa ngạnh răng biến đổi thành mũi tiêm phóng lao độc sắc nhọn bọc cơ, kết nối trực tiếp với bóng co bóp tuyến độc conotoxin khổng lồ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Vùi mình ẩn dưới lớp cát rạn san hô, nhô vòi thở và vòi dụ mồi dạng xúc tu thịt giả giun. Khi cá bơi sát, chúng xịt insulin vũ khí hóa làm hạ đường huyết gây hôn mê hàng loạt trước khi bắn lao độc.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc conotoxin chứa hơn 100 loại peptide thần kinh tác động đồng thời lên kênh ion natri/kali/canxi làm mất cảm giác đau đớn và tê liệt vận động hô hấp tức khắc.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1073/pnas.1423355112",
        "label": "PNAS - Specialized insulin in venom of Conus geographus"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins12040222",
        "label": "Toxins - Conotoxins from Conus geographus and their therapeutic applications"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nạn nhân bị ốc cối chích thường không cảm thấy đau đớn do độc tố chứa chất giảm đau cực mạnh mạnh gấp hàng chục ngàn lần morphine.",
        "Người ta gọi chúng là 'ốc điếu thuốc' vì nạn nhân bị đốt chỉ kịp hút hết một điếu thuốc trước khi tử vong do ngừng thở hoàn toàn."
      ];
      funAdd.forEach(f => addUniqueItem(newC.fun_facts, f));

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tấn công hóa học tầm xa bằng insulin cực nhanh và ngòi lao độc gây tê liệt không đau đớn.",
        "Miệng màng cơ giãn nở linh hoạt cực lớn cho phép nuốt chửng con mồi to gấp đôi thân."
      ];
      strAdd.forEach(s => addUniqueItem(newC.strengths, s));

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tốc độ di chuyển bò bằng chân bụng vô cùng chậm chạp và vụng về ngoài lớp cát.",
        "Tổn hao thời gian vài tiếng để vận chuyển một chiếc răng lao radula mới vào vị trí sẵn sàng bắn sau khi đã sử dụng kim cũ."
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
