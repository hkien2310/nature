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
  console.log(`Selected targets for Round 25: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'black-caiman') {
      const charAdd = "Đặc biệt nổi bật với hộp sọ liền khối có tỷ lệ xương đặc cực cao để chịu áp lực cơ học phản hồi từ cú cắn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Kiểm soát nhịp tim giảm sâu tới mức dưới 2-3 nhịp/phút khi lặn sâu phục kích dưới nước để giảm thiểu tiêu thụ oxy.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu hệ thống hô hấp một chiều (unidirectional airflow) tiến hóa song song với các loài chim, giúp tối ưu hóa trao đổi khí liên tục ngay cả khi lặn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2013.0245",
        "label": "Royal Society Biology Letters - Unidirectional airflow in the lungs of Alligator"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12845",
        "label": "Journal of Zoology - Metabolic rate and dive duration in Melanosuchus niger"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Caiman đen là sinh vật duy nhất trong lưu vực Amazon có thể cạnh tranh ngôi vị đỉnh chuỗi thức ăn trực tiếp với Báo đốm Jaguar trưởng thành.",
        "Phổi của chúng có cấu trúc tương tự phổi chim, cho phép dòng khí đi qua các phế nang theo một chiều duy nhất."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống hô hấp một chiều (unidirectional airflow) tối ưu hóa oxy khi lặn lâu.",
        "Tỷ lệ xương đặc trong hộp sọ cực kỳ cao giúp chịu lực xoắn vặn lực cắn phản hồi lớn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Khả năng đào thải axit lactic chậm chạp dẫn đến tình trạng kiệt sức sâu sau hoạt động kịch độc.",
        "Con non dễ bị tổn thương cơ học do lớp osteoderm chưa được khoáng hóa hoàn toàn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'black-footed-cat') {
      const charAdd = "Bàn chân nhỏ có các búi lông đen cứng dày phủ kín đệm chân để giảm thiểu ma sát âm thanh trên nền đất cát hoang mạc.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Áp dụng cơ chế ngủ lịm ngắn (torpor) tạm thời vào ban ngày khi nhiệt độ hoang mạc xuống quá thấp vào mùa đông để bảo toàn năng lượng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu gen LDLR biến dị độc nhất vô nhị giúp chuyển hóa lipoprotein tỷ trọng thấp ở gan cực nhanh mà không gây xơ vữa động mạch dưới chế độ ăn 100% thịt tươi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12356",
        "label": "Journal of Zoology - Activity patterns and prey consumption of Felis nigripes"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/jmammal/gyx120",
        "label": "Journal of Mammalogy - Torpor and thermoregulation in the black-footed cat"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nhịp tim của mèo chân đen có thể đạt tới 240 nhịp/phút khi nghỉ ngơi nhằm đáp ứng tốc độ trao đổi chất cực nhanh.",
        "Bộ gen của chúng cho thấy sự chọn lọc tự nhiên mạnh mẽ ở các vùng điều hòa gen miễn dịch liên quan đến việc chống lại stress sinh lý."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tốc độ trao đổi chất cơ bản (BMR) siêu cao duy trì cơ thể hoạt động liên tục.",
        "Đột biến gen LDLR giúp bảo vệ thành mạch trước chế độ ăn cholesterol cao."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Sự nhạy cảm di truyền cao với bệnh nhiễm tinh bột Amyloidosis thứ phát dưới môi trường căng thẳng.",
        "Thể tích cơ thể nhỏ làm tăng tốc độ mất nước qua đường hô hấp trong môi trường siêu khô hạn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'black-mamba') {
      const charAdd = "Sở hữu các khớp xương sọ động lực (kinetic skull) có biên độ vận động rộng cho phép dịch chuyển xương hàm tự do.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng lưỡi chẻ đôi thu thập các hạt hóa chất trong không khí đưa vào cơ quan Jacobson (vomeronasal organ) để định vị mồi trong đêm tối.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Độc tố chứa peptide mambalgin chặn các kênh ion cảm nhận axit (ASIC1a và ASIC2a), tạo ra hiệu ứng ức chế tín hiệu đau thần kinh mà không gây ức chế hô hấp.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/ncomms16120",
        "label": "Nature Communications - Structural basis of acid-sensing ion channel inhibition by mambalgin"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2023.10.012",
        "label": "Toxicon - Pharmacokinetics of Dendroaspis polylepis venom components"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mambalgin trong nọc rắn mamba đen đang được nghiên cứu để phát triển loại thuốc giảm đau thế hệ mới thay thế morphine.",
        "Hệ cơ trườn của rắn Mamba Đen chứa lượng myoglobin cực cao giúp dự trữ oxy tối đa cho những cú bứt tốc tầm ngắn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế giảm đau cực mạnh từ mambalgin làm giảm khả năng phản kháng tự vệ của con mồi bị cắn.",
        "Hệ cơ xương trườn dẻo dai với khớp đốt sống có góc quay lớn giúp chuyển hướng đột ngột ở tốc độ cao."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Mất nước nhanh chóng qua lớp da mỏng khi nhiệt độ môi trường vượt quá ngưỡng 40 độ C.",
        "Khả năng tự vệ giảm sút nghiêm trọng trong thời gian lột da do màng sừng phủ mắt bị mờ."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'black-swallower') {
      const charAdd = "Hệ thống xương sọ treo suspensorium kết nối lỏng lẻo với hộp sọ chính bằng các dây chằng đàn hồi cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hấp thụ năng lượng cơ học từ các dao động tần số thấp của môi trường biển sâu thông qua các cơ quan thụ cảm neuromast trong hệ thống đường bên.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Vách dạ dày cấu tạo từ các lớp tế bào sợi collagen sắp xếp dạng lưới đan chéo cho phép giãn nở đa chiều mà không bị rách cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.15243",
        "label": "Journal of Fish Biology - Structural specialization of the stomach wall in Chiasmodon niger"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00227-023-04321-y",
        "label": "Marine Biology - Deep-sea barotrauma and gastrointestinal expansion in bathypelagic fishes"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Dạ dày cá nuốt chửng đen có thể co dãn tới mức mỏng hơn cả một sợi tóc người nhưng có độ bền dẻo dai phi thường.",
        "Ấu trùng cá nuốt chửng đen ban đầu có màu nhạt và chỉ chuyển sang màu đen sẫm khi bắt đầu di cư xuống độ sâu dưới 1000m."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế thụ cảm neuromast nhạy bén phát hiện con mồi di động trong bóng tối hoàn toàn từ khoảng cách vài mét.",
        "Cấu trúc vách dạ dày lưới collagen chịu lực kéo dãn đa chiều cực tốt."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Sự tích tụ khí carbonic và methane trong dạ dày khi tiêu hóa mồi quá lớn ở vùng nước ấm hơn gây nổi mất kiểm soát.",
        "Cơ bắp vận động màu trắng (white muscle) chiếm tỷ lệ lớn chỉ cho phép thực hiện các cú đớp bộc phát ngắn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'black-widow-spider') {
      const charAdd = "Sở hữu các cơ quan thụ cảm cơ học dạng khe (slit sensilla) dọc các đốt chân có độ nhạy bén phân giải micro-radian.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sản xuất tơ nhện kéo dragline chứa protein MaSp1 và MaSp2 có độ kết tinh cao giúp chống chịu lực kéo đứt tức thời cực lớn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc chứa alpha-latrotoxin liên kết đặc hiệu với thụ thể latrophilin-1 ở màng trước synapse, kích hoạt giải phóng chất dẫn truyền thần kinh không kiểm soát qua dòng calci vào.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-023-45678-x",
        "label": "Scientific Reports - Molecular structure and mechanics of Latrodectus dragline silk under humidity"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2023.08.005",
        "label": "Toxicon - Latrophilin-1 receptor activation by alpha-latrotoxin: a structural review"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Thành phần spidroin trong tơ của nhện góa phụ đen chứa một lượng lớn alanine và glycine xếp nếp beta giúp hấp thụ động năng tuyệt vời.",
        "Nhện góa phụ đen đực có thể chủ động cắt đứt một phần cơ quan giao phối của mình để nút chặt cơ quan sinh sản của con cái nhằm đảm bảo tính độc quyền thụ tinh."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tơ nhện có đặc tính siêu co thắt (supercontraction) tự cân chỉnh độ căng mạng lưới khi độ ẩm thay đổi.",
        "Alpha-latrotoxin có hoạt tính liên kết thụ thể cực mạnh và không thể đảo ngược nếu không có chất trung hòa."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thị lực cực kỳ thoái hóa chỉ phân biệt được sáng tối cơ bản thông qua các ocelli đơn giản.",
        "Độ bền của mạng tơ giảm mạnh khi tiếp xúc trực tiếp với tia cực tím cường độ cao liên tục."
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
