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
  console.log(`Selected targets for Round 11: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'planarian-flatworm') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giun nước", "giáp xác nhỏ", "ấu trùng côn trùng", "ốc sên nhỏ", "xác hữu cơ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Sinh sản lưỡng tính chéo nhau ở dòng hữu tính bằng cách đẻ kén trứng chứa nhiều phôi. Ở dòng vô tính, chúng tự phân tách (fission) ở giữa thân rồi mỗi nửa tự tái tạo phần còn thiếu.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 10.0;
      newC.size_max_mm = 20.0;
      newC.weight_avg_g = 0.03;

      const charAdd = " Hệ trục cơ thể được định vị bởi nồng độ gradient của các phân tử phát tín hiệu như Wnt và BMP.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp điều kiện môi trường bất lợi cực đoan như khô hạn hoặc nhiệt độ cao, sán kế hoạch có thể kích hoạt quá trình tự thực bào (autophagy) để tái chế các bào quan bị hư hỏng nhằm duy trì năng lượng tối thiểu cho các tế bào gốc neoblast.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự tồn tại của nhóm gen phơi nhiễm phóng xạ giúp bảo vệ sự toàn vẹn của neoblast dưới tác động của tia X cường độ mạnh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1146/annurev-cellbio-100913-013026",
        "label": "Annual Review of Cell and Developmental Biology - Planarian Regeneration"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sán kế hoạch không có hệ hô hấp hay tuần hoàn thực sự, tất cả khí oxy và dưỡng chất được khuếch tán trực tiếp qua lớp da dẹt mỏng của chúng.",
        "Khi được ghép đầu từ một loài sán khác, các neoblasts của sán nhận sẽ tự động thích ứng để tái xây dựng lại các mô thần kinh kết nối theo sơ đồ trục của đầu mới."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng chống bức xạ ion hóa vượt trội nhờ cơ chế tự sửa chữa DNA và bảo vệ neoblast cực đoan.",
        "Tính linh hoạt chuyển đổi sinh học cho phép co rút cơ thể mà không làm mất đi các loại tế bào chức năng chính."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thiếu hụt hệ thống miễn dịch thích ứng (chỉ dựa vào miễn dịch bẩm sinh đơn giản), khiến chúng dễ bị tổn thương bởi một số loại nấm ký sinh chuyên biệt.",
        "Hoàn toàn bất lực trước dòng nước chảy quá xiết do lực bám từ lông rung và chất nhầy không đủ mạnh."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'platypus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ấu trùng côn trùng", "tôm nước ngọt", "giun", "nòng nọc", "ốc sên nhỏ"];
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 10;
      newC.lifespan_max = 17;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Sinh sản bằng cách đẻ trứng. Sau khi giao phối dưới nước, con cái đào hang sâu ấm áp và đẻ từ 1-3 quả trứng nhỏ vỏ dẻo dai. Trứng được ấp sát bụng mẹ trong 10 ngày. Con non sau khi nở tự liếm sữa tiết qua tuyến sữa ở lỗ chân lông da bụng mẹ.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 400.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 1500.0;

      const charAdd = " Lớp da mỏ mềm dẻo chứa các tuyến chất nhầy chuyên biệt giúp dẫn truyền tín hiệu điện thế trong nước ngọt hiệu quả hơn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng cựa độc ở chân sau để tạo ra các vết thương gây tê liệt cơ học tạm thời đối với kẻ xâm phạm lãnh thổ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ gen lưu giữ các cụm gen mã hóa vitellogenin cho phép tạo lòng đỏ trứng giống loài bò sát cổ đại.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/jmammal/gyab062",
        "label": "Journal of Mammalogy - Ornithorhynchus anatinus ecology and conservation"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Thú mỏ vịt không có răng thực sự khi trưởng thành, chúng thu thập sỏi nhỏ từ lòng sông để hỗ trợ việc nghiền nát thức ăn trong các túi má chứa mồi.",
        "Đuôi của thú mỏ vịt dẹt phẳng không dùng để đẩy nước bơi mà chủ yếu đóng vai trò bánh lái điều hướng và là kho dự trữ mỡ lớn nhất cơ thể."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống mỏ cảm thụ điện trường cực kỳ nhạy bén giúp chúng phát hiện con mồi ẩn dưới lớp bùn dày mà không cần dùng mắt hay tai.",
        "Bộ lông dày hai lớp không thấm nước có thể giam giữ một lớp khí mỏng cách nhiệt tuyệt vời dưới dòng nước lạnh."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tốc độ di chuyển trên cạn rất vụng về do các khớp chân hướng sang hai bên như loài bò sát.",
        "Độc tố ở cựa của con đực chỉ đạt độc lực tối đa trong mùa sinh sản, làm suy giảm khả năng phòng thủ hóa học ngoài mùa."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'polar-bear') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["hải cẩu có vòng", "hải cẩu râu", "moóc con", "cá voi beluga", "xác động vật biển"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Sinh sản bằng cách đẻ con. Gấu cái giao phối vào mùa xuân, sau đó đi đào hang tuyết trú ẩn vào mùa thu. Phôi thai chỉ bắt đầu phát triển khi gấu mẹ ngủ đông. Sinh từ 1-3 con non nhỏ bé (khoảng 600g) vào giữa mùa đông. Gấu con bú sữa cực giàu béo (30%) của mẹ trong hang cho tới mùa xuân ấm áp.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 40.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 2400.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 525000.0;

      const charAdd = " Cổ dài và đầu thuôn nhỏ giúp giảm tối đa lực cản thủy động học khi bơi lội dưới dòng nước băng giá.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Gấu Bắc Cực có thể đi vào trạng thái ngủ đông đi bộ (walking hibernation), giảm nhịp tim và trao đổi chất để sinh tồn khi nguồn thức ăn trở nên cực kỳ khan hiếm.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự biến dị đặc hữu của gen APOB hỗ trợ vận chuyển lipid trong máu hiệu quả mà không làm xơ vữa động mạch.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/mms.12782",
        "label": "Marine Mammal Science - Polar bear foraging ecology"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khứu giác của gấu Bắc Cực nhạy bén đến mức có thể phát hiện mùi của hải cẩu cách xa gần 30 km dưới lớp tuyết dày.",
        "Da của gấu Bắc Cực màu đen hoàn toàn để hấp thụ tối đa năng lượng mặt trời thông qua các sợi lông trong suốt rỗng ruột."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Bàn chân khổng lồ đường kính tới 30cm hoạt động như mái chèo đẩy nước mạnh mẽ và phân phối trọng lượng trên băng mỏng.",
        "Hộp sọ cứng cáp với lực cắn lớn dễ dàng nghiền nát lớp xương dày của con mồi lớn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Do khả năng giữ nhiệt quá xuất sắc, chúng nhanh chóng bị kiệt sức và sốc nhiệt nếu phải chạy tốc độ cao trên cạn.",
        "Phụ thuộc hoàn toàn vào diện tích băng biển để săn hải cẩu; băng tan làm giảm cơ hội săn mồi của chúng xuống mức báo động."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'pom-pom-crab') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["tảo biển", "mảnh vụn hữu cơ", "động vật thân mềm tí hon", "thức ăn thừa của hải quỳ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Sinh sản bằng cách đẻ trứng. Cua cái thụ tinh mang theo bọc trứng lớn màu cam tươi dưới bụng để bảo vệ cho đến khi trứng chuyển sang màu sẫm và nở thành ấu trùng zoea bơi tự do trôi nổi theo dòng nước.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 7.5;

      const charAdd = " Lớp biểu bì mai có cấu trúc sần sùi hỗ trợ cho việc bám dính của các vụn san hô tự nhiên để ngụy trang.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi bị đe dọa trực diện mà không có hải quỳ, cua có thể nhặt các mảnh bọt biển hoặc san hô mềm nhỏ để vẫy xua đuổi kẻ thù.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Cơ chế điều khiển thần kinh vận động tinh vi ở các chân ngực thứ nhất giúp bù đắp vai trò cầm nắm thức ăn thay cho đôi càng bị biến đổi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s10750-021-04672-x",
        "label": "Hydrobiologia - Symbiotic behavior of Lybia crabs"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khi cua đấm bốc lột xác, chúng đặt hai con hải quỳ xuống bên cạnh, lột lớp vỏ cũ ra rồi dùng lớp vỏ mới còn mềm mại để nhặt lại hải quỳ rất nhẹ nhàng.",
        "Hải quỳ được cua đấm bốc 'chăm sóc' thường có tốc độ phân chia tế bào sinh sản vô tính nhanh hơn nhiều so với hải quỳ sống tự do ngoài tự nhiên."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Sử dụng nọc độc từ các xúc tu của hải quỳ để tạo ra vùng phòng thủ sinh hóa cực kỳ lợi hại.",
        "Khả năng nhân bản vô tính vật cộng sinh bằng cách chủ động xé đôi thân hải quỳ khi bị mất một chiếc."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Đôi càng bị thu nhỏ tiến hóa thành các móc kẹp chỉ để giữ hải quỳ, làm mất đi khả năng kẹp xé vật lý thông thường.",
        "Lớp vỏ kitin rất mỏng và giòn, không đủ chống chịu các đòn cắn từ cá săn mồi cỡ vừa nếu bị tước vũ khí."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'portuguese-man-o-war') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "giáp xác nhỏ", "ấu trùng cá", "tôm nhỏ", "phiêu sinh động vật"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Quần thể sứa giải phóng giao tử trực tiếp vào cột nước biển để thụ tinh chéo. Phôi phát triển thành phân thể phao khí pneumatophore đầu tiên, sau đó nhân bản vô tính liên tục các zooids chuyên biệt khác để tạo thành siêu quần thể hoàn chỉnh.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 90.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 500.0;

      const charAdd = " Phao khí pneumatophore có màng lọc chọn lọc ngăn cản sự khuếch tán thất thoát của khí carbon monoxide ra môi trường.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Xúc tu dactylozooids có thể co rút cơ học cực nhanh (lên đến vài mét mỗi giây) để nhanh chóng kéo con mồi lên polyp gastrozooid.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự phân hóa chức năng hoàn hảo giữa các cá thể đơn tính zooid tích hợp thành một cơ thể hoạt động thống nhất.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2021.0543",
        "label": "Proceedings of the Royal Society B - Colonial organization of Physalia physalis"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù trông rất giống sứa, Chiến Binh Bồ Đào Nha thực chất là một loài sứa ống (siphonophore), là một tập hợp hàng ngàn cá thể nhỏ liên kết chặt chẽ.",
        "Chất độc của chúng vẫn giữ nguyên độc lực mạnh và khả năng kích hoạt phản xạ châm gai ngay cả khi xúc tu đã bị đứt lìa trôi dạt trên biển."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Nọc độc peptide thần kinh cực độc phá hủy hệ hô hấp và tim mạch của con mồi trong vài giây.",
        "Xúc tu săn mồi giăng lưới cực rộng dài tới 30m giúp tối đa hóa khả năng bắt mồi mà không cần bơi."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hoàn toàn phụ thuộc vào gió và dòng biển để di chuyển, dễ bị bão lớn thổi dạt vào bờ cát gây tử vong hàng loạt.",
        "Hệ thống phao nổi khí mỏng dễ bị đâm thủng hoặc phá hủy cơ học bởi rác thải nhựa đại dương."
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
