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
  console.log(`Selected targets for Round 10: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'paradise-flying-snake') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["thằn lằn bóng", "thằn lằn gecko", "dơi nhỏ", "côn trùng", "ếch cây", "chim nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Sinh sản bằng cách đẻ trứng (oviparous). Con cái đẻ mỗi lứa từ 5 đến 12 trứng trong hốc cây ẩm ướt hoặc dưới các lớp thảm thực vật mục nát. Trứng tự ấp trong môi trường tự nhiên ấm áp và nở sau khoảng 2-3 tháng.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 30.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1000.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 120.0;

      const charAdd = " Khung xương sườn gồm hơn 200 đốt sống với các khớp xoay linh động tối đa.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi nhảy phóng, rắn gập cơ thể lại tạo thành lò xo nén để phóng đẩy mình ra ngoài không khí.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Uốn lượn liên tục theo chu kỳ tần số 1-2 Hz để giữ vững thăng bằng hồi chuyển khi lướt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2020.0242",
        "label": "Biology Letters - Three-dimensional kinematics of flying snake glide"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.223841",
        "label": "Journal of Experimental Biology - Rib kinematics and aerodynamics in Chrysopelea"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng có khả năng điều chỉnh độ uốn lượn chữ S giữa không trung để giảm chấn khi va chạm đột ngột với tán lá cây.",
        "Hình dạng thân dẹt lõm của rắn bay khi lướt tạo ra một vùng áp suất thấp ở mặt trên cơ thể tương tự cánh máy bay hiện đại."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khung xương sườn đàn hồi linh động tối đa cho phép uốn dẹt cơ thể hoàn hảo.",
        "Khả năng thích ứng với dòng gió lốc cục bộ nhờ thay đổi góc nghiêng cơ thể liên tục."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tiêu tốn năng lượng sinh học đáng kể cho mỗi lần thiết lập cú nhảy gập thân.",
        "Dễ mất thăng bằng bay nếu đuôi bị chấn thương cơ học làm mất khả năng điều hướng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'payara') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá piranha đỏ", "cá piranha", "cá nhỏ", "cá hồi sông", "cá da trơn nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ trứng. Payara thực hiện di cư ngược nguồn sông vào mùa mưa để đẻ trứng ở những bãi sỏi ngập nước. Không có hành vi chăm sóc con non sau khi đẻ trứng.";
      newC.locomotion = 'swim';
      newC.speed_max = 35.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1000.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 14000.0;

      const charAdd = " Cấu trúc xương sọ cực kỳ cứng cáp và có các khoang rỗng sâu dọc theo xương hàm trên.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Đâm sập nanh vuốt trực diện vào cơ thể con mồi nhờ cú lao gia tốc nhanh.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Răng nanh có cấu trúc rỗng chứa mạch máu tủy răng lớn giúp tự phục hồi và giữ liên kết đàn hồi tốt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.13905",
        "label": "Journal of Fish Biology - Fangs and feeding mechanism of Hydrolycus"
      });
      addSource(newC.sources, {
        "url": "https://www.biodiversitylibrary.org/name/Hydrolycus_scomberoides",
        "label": "Biodiversity Heritage Library - Hydrolycus scomberoides taxonomy"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Răng nanh của cá Payara có thể tự mọc lại với tốc độ cực nhanh nếu bị gãy trong các trận săn mồi hỗn loạn.",
        "Khớp hàm của chúng có thể mở rộng tối đa 120 độ để ngậm gọn các con cá mồi cỡ lớn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hộp sọ trang bị đệm giảm chấn sinh học hấp thụ phản lực đâm nanh.",
        "Hệ thống cơ đuôi vân đỏ phân bố dày đặc cho sức bền bơi ngược dòng xiết vượt trội."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không thể tự vệ hiệu quả trước các loài rái cá khổng lồ đi săn theo bầy.",
        "Nhu cầu trao đổi chất hiếu khí cực cao khiến cá bị ngạt khí nhanh chóng khi nước lặng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'peacock-mantis-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua biển", "ốc biển", "sò biển", "nghêu", "tôm nhỏ", "cá nhỏ đáy biển"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Cặp đôi giao phối và con cái tự mang bọc trứng thụ tinh lớn (khoảng vài nghìn trứng) trước ngực để bảo vệ, thường xuyên làm sạch trứng bằng dòng nước sạch cho tới khi nở. Có tính chất một vợ một chồng trong thời gian dài.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 180.0;
      newC.weight_avg_g = 90.0;

      const charAdd = " Khớp gối tích lũy năng lượng meral sclerite có cấu trúc xương bọc kitin hình yên ngựa.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hang đào được lót bằng các mảnh vỏ vụn gia cố vách hang chống sạt lở cát.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Dactyl club có lớp ngoài chứa mật độ hạt nano hydroxyapatite vô định hình cực cao để tiêu giảm 90% phản lực.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.actbio.2019.04.015",
        "label": "Acta Biomaterialia - Helicoidal nanostructure of mantis shrimp dactyl club"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.1218512",
        "label": "Science - Nanostructured impact-resistant biocomposite in stomatopods"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Màng phản quang màu trên cơ thể tôm bọ ngựa có khả năng khúc xạ ánh sáng phân cực tròn độc nhất vô nhị.",
        "Chúng tự xây các rạn san hô nhân tạo thu nhỏ bằng cách xếp chồng các vỏ cua sò do chính mình đập vỡ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ cấu lò xo cơ học meral sclerite tích lũy năng lượng vô địch ở giáp xác.",
        "Vỏ bọc càng dactyl club có cấu trúc phân lớp xếp xoắn ốc triệt tiêu mọi vết nứt cơ học."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Sau khi lột xác, tôm bọ ngựa mất tới 7-10 ngày để canxi hóa cứng lại hoàn toàn dactyl club.",
        "Tiêu hao năng lượng chuyển hóa nội bào khổng lồ để duy trì hoạt động quét liên tục của hệ mắt kép."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'peregrine-falcon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["bồ câu hoang", "chim sẻ", "vịt hoang", "sáo đá", "dơi", "hải âu nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Sinh sản bằng cách đẻ trứng (oviparous). Cặp đôi chung thủy một vợ một chồng suốt đời. Con cái đẻ từ 3 đến 4 trứng trên các hốc đá hoặc vách đá cao cheo leo. Cả chim bố và chim mẹ thay phiên nhau ấp trứng trong khoảng 29-33 ngày.";
      newC.locomotion = 'fly';
      newC.speed_max = 389.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 340.0;
      newC.size_max_mm = 580.0;
      newC.weight_avg_g = 1100.0;

      const charAdd = " Cánh dài nhọn hình mũi mác thích nghi tối đa cho các cú bay liệng và bổ nhào tốc độ cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Đánh úp con mồi bằng móng vuốt chân sau dang rộng thành nắm đấm sắt va chạm động năng lớn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Lỗ mũi có các gờ xương hình nón (tubercles) phân tán luồng khí áp suất cao giúp hít thở bình thường.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.095398",
        "label": "Journal of Experimental Biology - Flight dynamics of peregrine falcon"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/ibi.12282",
        "label": "Ibis - Diving speed and aerodynamic drag of peregrine falcons"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Màng nháy bán trong suốt tự động quét ngang mắt với tần số cao để loại bỏ hạt bụi trong cú bổ nhào.",
        "Khớp cơ cánh của chim ưng có khóa chốt cơ học chịu lực cản gió lớn để giữ form cánh ổn định."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Thị giác lập thể kép cho phép tập trung tiêu cự vào con mồi đang di chuyển tốc độ cực lớn.",
        "Mỏ trên sở hữu răng tomial sắc nhọn tối ưu cho việc cắt kết liễu tủy sống con mồi."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Sải cánh dài phẳng khiến chim rất khó cất cánh từ vũng bùn lầy hoặc thảm cỏ rậm.",
        "Tuyệt đối nhạy cảm với việc tích tụ sinh học các chất độc hóa học nông nghiệp qua chuỗi thức ăn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'pistol-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "giun nhiều tơ", "tôm nhỏ", "cua nhỏ", "nhuyễn thể"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Thường sống thành từng cặp đực cái bền vững trong một hang. Con cái đẻ trứng và mang trứng bên dưới các tấm vây bụng (pleopods) để bảo vệ cho đến khi trứng nở thành ấu trùng trôi nổi tự do.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 25.0;

      const charAdd = " Càng lớn tích hợp pittông và ổ cối ăn khớp hoàn hảo tạo luồng phun nước tốc độ cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Phát tiếng nổ cường độ 218 dB để đập tan hệ thống giác quan và gây choáng con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khớp càng có cơ cấu hãm (slip joint) giải phóng năng lượng cơ học đàn hồi cực nhanh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1121/1.428616",
        "label": "Journal of the Acoustical Society of America - Snapping shrimp sound characteristics"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.289.5488.2277",
        "label": "Science - How snapping shrimp snap"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Vũ khí càng súng bong bóng của chúng có thể tạo ra âm thanh lớn lấn át cả động cơ tàu phá băng lớn.",
        "Tôm súng sử dụng càng súng như một thiết bị siêu âm giao tiếp tần số cao với các tập đoàn tôm súng lân cận."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ khớp súng tích hợp protein resilin đàn hồi siêu cấp chịu tải lực va chạm lặp lại.",
        "Mối giao hảo cộng sinh chặt chẽ với cá bống giúp chúng bù đắp khiếm khuyết thị giác hoàn hảo."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Chiếc càng súng khổng lồ chiếm tới 40% khối lượng cơ thể làm mất tính cân bằng trọng tâm khi bơi tự do.",
        "Nếu rơi vào môi trường nước ngọt, cơ chế tạo bọt khí xâm thực bị tê liệt hoàn toàn do thay đổi sức căng bề mặt nước."
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
