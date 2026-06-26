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
  console.log(`Selected targets for Round 19: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'weaver-ant') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật ngọt", "côn trùng nhỏ", "ấu trùng", "nhện", "xác động vật nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Một kiến chúa duy nhất thành lập tổ sau chuyến bay giao phối. Kiến chúa đẻ trứng, ban đầu tự nuôi dưỡng thế hệ công nhân đầu tiên. Trứng thụ tinh nở ra kiến thợ (cái), trứng không thụ tinh nở ra kiến đực.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.15;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.008;

      const charAdd = " Cấu trúc giác bám chân (arolia) hoạt động bằng cơ chế thủy lực chủ động, kết hợp với các vuốt bám cong tạo lực bám dính chặt chẽ lên lá cây trơn bóng ngay cả dưới trời mưa lớn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tổ kiến dệt lá được cấu tạo từ hàng nghìn chiếc lá tươi khâu lại bằng tơ ấu trùng siêu bền, tạo nên cấu trúc rỗng cách nhiệt và chống thấm nước cực kỳ hiệu quả bảo vệ cả đàn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng sử dụng cơ thể thợ làm cầu nối sống co giãn tạo xích lực kéo căng các mép lá lại gần nhau để dệt tổ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsif.2010.0215",
        "label": "Journal of The Royal Society Interface - Adhesion and friction of weaver ants"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sợi tơ do ấu trùng kiến dệt lá tiết ra bền đến mức có thể chịu được lực kéo lớn gấp nhiều lần trọng lượng của bản thân ấu trùng.",
        "Kiến thợ có thể cõng trên lưng con mồi nặng gấp 100 lần trọng lượng cơ thể chúng khi leo thẳng đứng lên thân cây."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tính bám dính siêu việt nhờ giác bám chân arolia chứa dịch lỏng kết dính chủ động",
        "Sử dụng ấu trùng làm công cụ tiết tơ dệt tổ độc nhất vô nhị"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nhạy cảm cao với sự giảm sút độ ẩm không khí khiến lá tổ bị khô héo rụng rời",
        "Phụ thuộc hoàn toàn vào ấu trùng để sửa chữa tổ khi bị hư hại"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'wels-catfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "ếch", "loài giáp xác", "chim nước", "gặm nhấm nhỏ", "lưỡng cư"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng vào mùa xuân khi nước ấm lên. Con đực làm tổ nông bằng rễ cây thủy sinh hoặc bùn, canh giữ và quạt nước cho trứng trong suốt 3-10 ngày cho đến khi trứng nở.';
      newC.locomotion = 'swim';
      newC.speed_max = 20.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1300.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 45000.0;

      const charAdd = " Hệ cơ quan Weberian liên kết bong bóng cá trực tiếp với tai trong giúp cá nheo nhạy cảm cực cao với chấn động âm thanh tần số thấp trong nước.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hệ thống thụ thể Ampullae of Lorenzini phân bố dày đặc quanh đầu giúp phát hiện dòng điện sinh học cực yếu từ cơ bắp con mồi trốn dưới bùn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng lao người lên bãi cạn (beaching) để bắt chim bồ câu uống nước bên bờ sông vô cùng táo bạo.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s10211-020-00354-1",
        "label": "Fish Physiology and Biochemistry - Hearing capabilities and Weberian apparatus of Silurus glanis"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cá nheo châu Âu có thể đớp gọn và nuốt chửng cả những con chim bồ câu dọc theo bờ sông Tarn ở Pháp bằng hành vi săn mồi đột kích trên cạn.",
        "Toàn bộ cơ thể cá nheo châu Âu được bao phủ bởi hàng nghìn nụ vị giác, giúp chúng có thể 'nếm' được thức ăn mà không cần phải mở miệng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng nhịn ăn kéo dài suốt mùa đông bằng cách làm chậm nhịp tim và trao đổi chất",
        "Lớp da trơn tiết chất nhờn dày giảm ma sát khi bơi và chống nhiễm khuẩn"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nhạy cảm cao với sự biến đổi môi trường nước bùn đáy sông bị ô nhiễm hóa chất độc hại",
        "Tốc độ phản ứng và xoay xở kém linh hoạt ở vùng nước chảy xiết hoặc quá nông"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'western-diamondback-rattlesnake') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chuột", "sóc đất", "thỏ nhỏ", "chim", "thằn lằn"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con (ovoviviparous). Con cái mang trứng bên trong cơ thể cho đến khi trứng nở thành con non bò ra ngoài. Mỗi lứa từ 10-20 con non, con non mới sinh đã có sẵn nọc độc và răng nanh.';
      newC.locomotion = 'crawl';
      newC.speed_max = 4.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 900.0;
      newC.size_max_mm = 1800.0;
      newC.weight_avg_g = 2000.0;

      const charAdd = " Hố nhiệt (loreal pit) nằm giữa mắt và lỗ mũi chứa màng cảm biến nhiệt độ siêu mỏng, liên kết trực tiếp với vùng não thị giác giúp dựng hình ảnh nhiệt 3D hoàn hảo.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Rung lục lạc sừng ở đuôi tạo âm thanh cảnh báo xua đuổi những động vật móng guốc lớn có thể vô tình giẫm bẹp cơ thể rắn chuông.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng kiểm soát lượng nọc độc tiêm vào đối thủ (venom metering) tùy theo kích thước con mồi hoặc mức độ nguy hiểm từ kẻ thù.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2021.0343",
        "label": "Biology Letters - Rattlesnakes use acoustic distance warning signals"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Lục lạc ở đuôi rắn chuông thực chất cấu tạo từ các vòng sừng rỗng móc xích vào nhau, mỗi lần rắn lột xác sẽ có thêm một vòng sừng mới.",
        "Rắn chuông có thể rung lắc đuôi với tần số lên tới 60 lần mỗi giây liên tục trong nhiều giờ mà không bị mỏi cơ, nhờ tế bào cơ có lượng ty thể khổng lồ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống hố cảm biến nhiệt hồng ngoại siêu nhạy bén phát hiện mồi trong bóng tối",
        "Cơ đuôi lắc tốc độ cực cao chứa các sợi cơ chuyên biệt co giãn siêu tốc không biết mỏi"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Phụ thuộc vào nhiệt độ môi trường bên ngoài để sưởi ấm, cơ thể tê liệt khi trời quá lạnh",
        "Dễ bị săn lùng bởi rắn hoàng đế (Kingsnake) do loài này miễn nhiễm với nọc rắn chuông"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'wolverine') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["tuần lộc", "nai sừng tấm", "xác thối", "động vật gặm nhấm", "trứng chim", "quả mọng"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 8;
      newC.lifespan_max = 13;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản thụ tinh chậm (delayed implantation). Giao phối vào mùa hè nhưng phôi thai trì hoãn bám vào tử cung cho đến mùa đông để đảm bảo con non sinh ra vào mùa xuân ấm áp.';
      newC.locomotion = 'walk';
      newC.speed_max = 48.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 650.0;
      newC.size_max_mm = 1050.0;
      newC.weight_avg_g = 15000.0;

      const charAdd = " Răng hàm trên xoay 90 độ hướng vào trong giúp gặm đứt những miếng thịt đông cứng như đá và cắn nát những khúc xương ống của động vật lớn dễ dàng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng bàn chân lớn hoạt động như chiếc giày trượt tuyết phân tán trọng lượng để chạy nhanh trên nền tuyết xốp săn đuổi con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến xạ cực kỳ hôi hám tiết dịch xạ hương nồng nặc để đánh dấu thức ăn bị chôn giấu và ngăn các loài ăn thịt khác cướp mồi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.2981/wlb.00995",
        "label": "Wildlife Biology - Wolverines search efficiency and olfactory capability in snow cover"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chồn Wolverine có thể đánh hơi thấy xác động vật bị chôn sâu dưới lớp tuyết dày hơn 6 mét và đào bới nhanh chóng để tiếp cận thức ăn.",
        "Nhờ lớp lông cấu tạo đặc biệt chống nước và chống bám tuyết cực mạnh, chồn Wolverine có thể ngủ ngon lành trên nền tuyết lạnh giá mà không bị mất nhiệt."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống xương khớp thái dương hàm khóa chặt chống trật khớp khi cắn xé lực mạnh",
        "Lực cắn nghiền nát xương siêu hạng phá vỡ lớp tủy xương bổ dưỡng"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tỷ lệ sinh sản thấp và nhạy cảm cao với sự biến đổi diện tích tuyết phủ mùa xuân phục vụ làm hang",
        "Mùi cơ thể nồng nặc khiến chúng không thể ngụy trang phục kích con mồi cự ly gần"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'wood-frog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["nhện", "bọ cánh cứng", "sâu bướm", "giun đất", "ốc sên"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng vào đầu mùa xuân ngay sau khi rã đông. Con cái đẻ hàng ngàn quả trứng thành khối lớn bám vào thảm thực vật dưới nước trong các vũng nước tạm thời.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 70.0;
      newC.weight_avg_g = 8.0;

      const charAdd = " Bộ gan phình to dự trữ lượng glycogen khổng lồ chuyển hóa thành glucose cực nhanh giải phóng vào máu ngay khi cảm nhận tinh thể băng bám trên da.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Ngừng đập tim và hô hấp hoàn toàn, chuyển sang hô hấp kị khí ở tế bào nhờ sự bảo vệ tế bào của urê và glucose nồng độ cao.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng chịu đông cứng sinh học tuyệt đối với hơn 70% lượng nước trong cơ thể kết tinh đóng băng mà không làm rách màng tế bào.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.238477",
        "label": "Journal of Experimental Biology - Glucose and urea regulation in freeze-tolerant wood frogs"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khi ếch gỗ Bắc Mỹ rã đông vào mùa xuân, quả tim của nó sẽ tự động bắt đầu đập trở lại đầu tiên, sau đó mới kích hoạt lại bộ não và các dây thần kinh vận động.",
        "Trong suốt thời gian đóng băng ngủ đông kéo dài 6 tháng, ếch gỗ không bài tiết nước tiểu mà tái chế urê tích tụ làm chất giữ nước và bảo vệ đông hiệu quả."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống đông lạnh sinh học kiểm soát tinh thể băng hình thành chỉ ở khoang ngoài tế bào",
        "Sản sinh chuỗi peptide kháng khuẩn AMPs mạnh mẽ trên da chống nhiễm trùng khi nằm dưới bùn tuyết"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nòng nọc rất nhạy cảm với sự sụt giảm tầng ozon gây gia tăng tia cực tím UV-B phá hủy ADN",
        "Chu kỳ rã đông rập rình vào giữa đông có thể vắt kiệt glycogen dự trữ khiến ếch tử vong"
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
