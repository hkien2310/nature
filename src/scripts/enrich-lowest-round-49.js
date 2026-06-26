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
  console.log(`Selected targets for Round 49: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
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

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'scaly-foot-snail') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["vi khuẩn cộng sinh", "chất hữu cơ hòa tan", "hợp chất lưu huỳnh"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đồng thời (simultaneous hermaphrodite). Chúng tự thụ tinh hoặc thụ tinh chéo dưới biển sâu. Trứng sau khi đẻ được thả trôi tự do và phát triển thành ấu trùng bơi lội tự do trước khi định cư cạnh các miệng phun thủy nhiệt.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 35.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 20.0;

      newC.characteristics = appendText(c.characteristics, "Cơ thể được bảo vệ bởi lớp vỏ sắt greigite ba lớp chịu áp cực hạn và giảm thiểu ứng suất cơ học từ các đòn kẹp nghiền của cua biển sâu.");
      newC.survival_method = appendText(c.survival_method, "Hấp thu và chuyển hóa lưu huỳnh nhờ các vi khuẩn nội cộng sinh bên trong tuyến thực quản mở rộng đặc biệt.");
      newC.unique_traits = appendText(c.unique_traits, "Sinh vật duy nhất được ghi nhận sử dụng greigite (sắt sulfua từ tính) làm vật liệu chính cho lớp giáp xương ngoài.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Độ bền vỏ giáp cơ học ba lớp có tính chất tiêu tán năng lượng độc đáo chống nứt vỡ.");
      addUniqueItem(newC.strengths, "Khả năng chịu đựng hydrogen sulfide với nồng độ độc hại chết người đối với động vật thông thường.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hệ thống hô hấp và tiêu hóa bị phụ thuộc 100% vào hoạt động ổn định của dòng thủy nhiệt phun khoáng.");
      addUniqueItem(newC.weaknesses, "Vỏ giáp sắt có nguy cơ bị ăn mòn hóa học cao nếu tiếp xúc với dòng nước giàu oxy hòa tan đột ngột.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Do cấu trúc greigite từ tính ở chân và vỏ, ốc sên chân giáp có thể bị hút chặt bởi các nam châm mạnh.");
      addUniqueItem(newC.fun_facts, "Cấu trúc áo giáp của chúng là mô hình lý tưởng để các kỹ sư phỏng sinh học thiết kế các loại áo chống đạn thế hệ mới.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1073/pnas.2008189117",
        label: "PNAS - Iron-rich scales and armor of the scaly-foot gastropod"
      });

    } else if (c.id === 'sea-cucumber') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["mùn bã hữu cơ", "tảo biển", "vi sinh vật tầng đáy", "cát biển"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thụ tinh ngoài (oviparous). Các cá thể đực và cái phóng giao tử vào nước biển một cách đồng bộ theo chu kỳ mặt trăng. Một số loài sâu dưới đáy biển có thể ấp trứng trực tiếp dưới cơ thể.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 300.0;

      newC.characteristics = appendText(c.characteristics, "Lớp biểu bì dai chứa hàng triệu vi cấu trúc sclerite canxi cacbonat có kích thước micro giúp tăng cường độ nhớt liên kết mô.");
      newC.survival_method = appendText(c.survival_method, "Điều khiển áp suất thẩm thấu nội bào bằng axit amin tự do để thích ứng sự dao động lớn của nồng độ muối đại dương.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu mô catch collagen có thể thay đổi trạng thái độ cứng từ lỏng hóa dẻo sang cứng như thép dưới sự kiểm soát của xung thần kinh canxi.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Tự tái sinh các cơ quan nội tạng quan trọng như ruột và phổi nước bị thải bỏ chỉ sau vài tuần.");
      addUniqueItem(newC.strengths, "Ống Cuvierian cực kỳ bám dính chứa độc tố saponin khóa chặt cơ quan hô hấp của các loài cá săn mồi.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Quá trình tự thải ruột tiêu tốn lượng protein dự trữ cực kỳ khổng lồ khiến cơ thể rơi vào trạng thái suy nhược dài ngày.");
      addUniqueItem(newC.weaknesses, "Rất dễ bị cá lớn hoặc động vật chân đầu tấn công từ xa do thiếu cơ quan thị giác thực sự để cảnh báo nguy hiểm sớm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hải sâm thở bằng hậu môn qua cơ quan phổi nước có dạng nhánh cây bên trong khoang cơ thể.");
      addUniqueItem(newC.fun_facts, "Cá Pearlfish ký sinh sử dụng hậu môn của hải sâm như một cái hang trú ẩn an toàn, thọc đầu bơi vào trong mà không hề gây hại cho chủ nhà.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.091173",
        "label": "JEB - Physiology of catch connective tissue and mechanical adaptation in holothurians"
      });

    } else if (c.id === 'sea-lamprey') {
      newC.diet_type = 'parasitic';
      newC.diet_items = ["máu cá hồi", "máu cá tuyết", "dịch cơ thể vật chủ", "mô cơ cá xương"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính một lần duy nhất trong đời (semelparous). Sau khi bơi ngược dòng vào sông suối nước ngọt, con đực và con cái cùng xây tổ bằng đá, đẻ hàng vạn trứng rồi kiệt sức và chết hàng loạt.';
      newC.locomotion = 'swim';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 1500.0;

      newC.characteristics = appendText(c.characteristics, "Thân hình thon dài trơn nhớt không vảy giúp tối thiểu hóa lực cản thủy động lực học khi bơi lội ngược dòng xiết.");
      newC.survival_method = appendText(c.survival_method, "Tiết glycoprotein lamphredin từ tuyến nước bọt ngăn chặn hoàn toàn cơ chế đông máu và làm tan huyết mô vật chủ.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu hệ thống miễn dịch tiến hóa sớm nhất dựa trên thụ thể lympho thay thế (VLR) không có cấu trúc globulin.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng leo qua các đập dốc đứng bằng cách nhích dần cơ thể nhờ lực hút chân không khổng lồ từ đĩa miệng.");
      addUniqueItem(newC.strengths, "Hệ thống khứu giác siêu nhạy bén phát hiện nồng độ cực nhỏ của hóa chất chỉ thị từ cá vật chủ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Cái chết không thể tránh khỏi sau mùa sinh sản duy nhất do sự thoái hóa nội tạng hoàn toàn để dồn năng lượng tạo giao tử.");
      addUniqueItem(newC.weaknesses, "Thiếu hàm thực sự khiến chúng hoàn toàn bất lực trong việc cắn xé thức ăn rắn hoặc tự vệ cận chiến chủ động.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ấu trùng cá mút đá hoàn toàn mù và không có răng răng sừng, sống chôn mình dưới cát sông lọc mùn hữu cơ suốt nhiều năm.");
      addUniqueItem(newC.fun_facts, "Hóa thạch cổ xưa nhất của loài này có niên đại hơn 360 triệu năm, xuất hiện trước cả khủng long và hầu như không thay đổi cấu trúc.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/jfb.13488",
        "label": "Journal of Fish Biology - Host-parasite interactions and lamphredin anticoagulants"
      });

    } else if (c.id === 'secretary-bird') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["rắn độc", "rắn hổ mang", "chuột đồng", "thằn lằn", "côn trùng lớn", "rùa nhỏ", "chim non"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Một vợ một chồng suốt đời (monogamous). Cả hai cùng xây dựng tổ khổng lồ rộng đến 2.5m trên ngọn cây keo gai. Con cái đẻ từ 2-3 trứng và cả hai bố mẹ cùng thay phiên ấp trứng trong vòng 45 ngày.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 30.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 1200.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 3800.0;

      newC.characteristics = appendText(c.characteristics, "Xương chày bọc cơ đùi phát triển liên kết với hệ gân bàn chân dai cho phép tạo lực giật mô-men xoắn gia tốc cao.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng cấu trúc xòe cánh xù lông đánh lạc hướng tầm nhìn rắn độc trước khi giậm đòn trực diện vào sọ.");
      newC.unique_traits = appendText(c.unique_traits, "Gia tốc lực giậm chân cực đại đạt tới 20G (gấp 20 lần gia tốc trọng trường) chỉ trong chớp mắt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cú đá giậm bộc phát áp lực nén tập trung qua móng chân phẳng gây chấn thương sọ não nghiêm trọng cho mồi.");
      addUniqueItem(newC.strengths, "Hệ thống khớp cổ linh hoạt chịu đựng lực phản chấn cực tốt từ cú đá dội ngược đất đá.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Đôi chân quá dài làm hạn chế khả năng linh động trong các bụi gai dày rậm rạp.");
      addUniqueItem(newC.weaknesses, "Yêu cầu khoảng trống chạy đà phẳng dài để cất cánh bay cao khiến dễ bị thú săn mồi cạn phục kích.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hàng mi cong dài thời thượng của chim thư ký thực chất là chùm lông chuyên dụng để cản cát bụi thảo nguyên thổi vào mắt.");
      addUniqueItem(newC.fun_facts, "Chúng là loài chim quốc gia của Sudan và xuất hiện trang trọng trên quốc huy Nam Phi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsbl.2015.0807",
        "label": "Royal Society - Secretarybird kick force dynamics"
      });

    } else if (c.id === 'secretarybird') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["rắn độc", "rắn hổ mang", "côn trùng", "chuột", "thằn lằn", "ếch nhái", "trứng chim"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Kết đôi một vợ một chồng trọn đời. Chim bố mẹ thay phiên nhau ấp trứng trong tổ lớn đắp bằng cành cây mục trên đỉnh cây keo gai. Nuôi con non bằng cách nôn thức ăn bán tiêu hóa đã bỏ đầu độc.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 30.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 900.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 4000.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu các bó cơ đùi ngắn có tỷ lệ sợi cơ co rút nhanh (fast-twitch) cực kỳ cao, tối ưu lực búng gót siêu tốc.");
      newC.survival_method = appendText(c.survival_method, "Đi bộ lùng sục savannah theo hình zic-zắc để xua đuổi các loài bò sát ẩn nấp trong bụi rậm lộ diện.");
      newC.unique_traits = appendText(c.unique_traits, "Cú đạp giậm đạt phản lực đỉnh điểm 195 Newton chỉ trong thời gian tiếp xúc 15 mili giây.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phân tán phản lực tác động dội ngược từ bề mặt đá cứng qua hệ thống khớp mắt cá chân linh hoạt.");
      addUniqueItem(newC.strengths, "Sải cánh rộng 2 mét tạo thế cân bằng khí động học xuất sắc trong quá trình tung cú đá xoay vòng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thời gian nuôi dưỡng chim non kéo dài khiến tổ dễ bị các loài dã thú leo trèo như báo hoa mai cướp phá.");
      addUniqueItem(newC.weaknesses, "Rất dễ bị tổn thương gãy xương ống chân nếu giậm trượt mục tiêu vào các gốc cây gỗ khô cứng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tên khoa học Sagittarius serpentarius có nghĩa là 'người bắn cung săn rắn' do chùm lông gáy trông giống các mũi tên cắm trong ống tên.");
      addUniqueItem(newC.fun_facts, "Chim thư ký có thể đi bộ săn mồi suốt cả ngày với quãng đường tương đương một trận chạy marathon (khoảng 30-40 km).");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/ibi.12920",
        "label": "Ibis - Secretarybird habitat use and conservation threat assessment"
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
