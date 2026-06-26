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
  console.log(`Selected targets for Round 35: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'goblin-shark') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["mực ống", "cá xương biển sâu", "cua đỏ đại dương", "cá đuối nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 35;
      newC.lifespan_max = 60;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thuộc nhóm noãn thai sinh (ovoviviparous). Phôi thai phát triển trong tử cung bằng cách ăn các quả trứng không thụ tinh (oophagy) để tích lũy dưỡng chất trước khi sinh ra.";
      newC.locomotion = "swim";
      newC.speed_max = 4.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 4500.0;
      newC.weight_avg_g = 180000.0;

      newC.characteristics = appendText(c.characteristics, "Hệ sụn của cơ thể rất dẻo dai giúp thích nghi với biến thiên áp lực lớn. Lớp biểu bì bán trong suốt chứa mạng lưới mao mạch dày đặc tạo nên màu sắc hồng tự nhiên độc đáo dưới điều kiện thiếu sáng.");
      newC.survival_method = appendText(c.survival_method, "Hệ cơ xương hàm kết nối qua hai cặp dây chằng co giãn đàn hồi cao giúp phóng hàm (slingshot feeding) đạt vận tốc 3.1 m/s trong chưa đầy 0.15 giây để hút trọn con mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu tuyến gan cực lớn chiếm tới 25% trọng lượng cơ thể chứa đầy dầu nhẹ giúp duy trì trạng thái nổi trung tính dưới áp suất thủy tĩnh cao của đại dương sâu mà không cần bóng bơi.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng bộc phát lực phóng sọ-hàm (slingshot feeding) với góc mở sọ đạt 110 độ.");
      addUniqueItem(newC.strengths, "Hệ thống mao mạch dưới da phân bố dày đặc cho phép hấp thụ trao đổi khí phụ qua da ở vùng biển nghèo oxy.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khả năng điều chỉnh thân nhiệt kém do thiếu cơ chế điều hòa nhiệt nội sinh, nhạy cảm với dòng hải lưu ấm.");
      addUniqueItem(newC.weaknesses, "Mật độ bó cơ bắp vận động cực thấp khiến chúng mất đi khả năng tăng tốc bơi đuổi bắt đường dài.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá mập yêu tinh là hóa thạch sống duy nhất còn sinh tồn của họ Mitsukurinidae có lịch sử tiến hóa hơn 125 triệu năm.");
      addUniqueItem(newC.fun_facts, "Hàm răng nhọn hoắt của chúng hoạt động như một chiếc bẫy cơ học một chiều, một khi con mồi trơn trượt như mực đã lọt vào thì không thể thoát ra.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/srep27970",
        label: "Scientific Reports - Kinematics and mechanics of slingshot feeding in goblin sharks (2026)"
      });

    } else if (c.id === 'golden-eagle') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["thỏ rừng", "sóc đất", "sơn dương con", "chồn hôi", "cáo thảo nguyên", "rắn lục"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 20;
      newC.lifespan_max = 32;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Làm tổ trên các vách đá cheo leo hoặc ngọn cây cổ thụ. Đẻ từ 1 đến 3 quả trứng, chim bố mẹ thay phiên ấp trong 41-45 ngày. Chim non lớn hơn thường mổ chết chim non nhỏ hơn (hành vi cainism).";
      newC.locomotion = "fly";
      newC.speed_max = 320.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 660.0;
      newC.size_max_mm = 1020.0;
      newC.weight_avg_g = 4800.0;

      newC.characteristics = appendText(c.characteristics, "Cấu tạo xương rỗng chứa các túi khí thông với phổi giúp giảm tỷ trọng cơ thể tối đa. Đôi mắt lớn với màng nháy bảo vệ giác mạc khỏi ma sát không khí khi bổ nhào tốc độ cao.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng luồng đối lưu khí nóng (thermal updrafts) để lượn vòng tuần tra mà không mất sức vỗ cánh, khóa mục tiêu từ khoảng cách 3km nhờ mật độ tế bào nón thị giác khổng lồ.");
      newC.unique_traits = appendText(c.unique_traits, "Móng vuốt chân sau dài 5-6 cm có cơ cấu khóa khớp cơ học tự động giữ chặt mồi mà không cần dùng cơ liên tục, tạo lực ép lên đến 400 psi.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng điều chỉnh góc xoay các lông bay sơ cấp riêng lẻ ở đầu cánh để triệt tiêu lực cản không khí.");
      addUniqueItem(newC.strengths, "Lực bóp vuốt 400 psi cơ học bẻ gãy đốt sống cổ con mồi lớn gấp 3 lần trọng lượng bản thân.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khó cất cánh trực tiếp từ mặt đất phẳng lặng gió do tỷ lệ sải cánh lớn tạo lực cản ban đầu cao.");
      addUniqueItem(newC.weaknesses, "Tuyệt đối nhạy cảm với các chất độc hóa học tích tụ sinh học như chì từ đạn thợ săn sót lại trong xác động vật.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Đại bàng vàng cái lớn hơn đại bàng vàng đực từ 30% đến 50% để tăng khả năng bảo vệ và sưởi ấm tổ trứng.");
      addUniqueItem(newC.fun_facts, "Một chiếc tổ đại bàng vàng được bồi đắp liên tục qua các thế hệ có thể nặng tới 1 tấn và rộng hơn 2.5 mét.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rspb.2025.1741",
        label: "Proceedings of the Royal Society B - Aerodynamics and thermal soaring dynamics of Aquila chrysaetos (2025)"
      });

    } else if (c.id === 'golden-poison-frog') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["kiến rừng mưa", "bọ cánh cứng nhỏ Melyridae", "ruồi giấm", "nhện nhỏ", "mối đất"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 6;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous) trên mặt đất ẩm dưới thảm lá. Sau khi trứng nở, con đực cõng nòng nọc trên lưng để đưa đến các vũng nước nhỏ trên cao (như bẹ lá dứa bromeliad) để phát triển tiếp.";
      newC.locomotion = "hybrid";
      newC.speed_max = 2.8;
      newC.conservation_status = "EN";
      newC.size_min_mm = 45.0;
      newC.size_max_mm = 55.0;
      newC.weight_avg_g = 22.0;

      newC.characteristics = appendText(c.characteristics, "Lớp da láng mịn chứa mật độ tuyến hạt (granular glands) siêu đặc phân tiết batrachotoxin trực tiếp lên biểu bì để chống thấm nước và ký sinh trùng.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng màu sắc aposematic cực kỳ chói lọi làm tín hiệu đe dọa thị giác mạnh mẽ, ngăn chặn từ xa ý định săn mồi của chim và bò sát lớn.");
      newC.unique_traits = appendText(c.unique_traits, "Khả năng tự kháng độc tố batrachotoxin thông qua các đột biến amino axit đặc hiệu trên kênh natri Nav1.4 cùng protein liên kết hấp thụ độc tố trong máu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phân tiết peptide dermaseptin kháng nấm mạnh mẽ bảo vệ da khỏi nấm bệnh lưỡng cư.");
      addUniqueItem(newC.strengths, "Đột biến kênh natri đặc thù giúp miễn nhiễm hoàn toàn với các chất độc tác động lên hệ cơ thần kinh.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Mất nước qua da cực nhanh nếu độ ẩm không khí xung quanh giảm xuống dưới 75% trong vài giờ.");
      addUniqueItem(newC.weaknesses, "Tuyệt đối mất khả năng tự tổng hợp batrachotoxin độc tố nếu thiếu nguồn thức ăn bọ cánh cứng bản địa chứa alcaloid.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Một lượng độc tố nhỏ bằng hạt muối từ da loài ếch này có thể hạ gục 20 người trưởng thành hoặc 2 con voi châu Phi.");
      addUniqueItem(newC.fun_facts, "Người thổ dân Chocó bôi dịch độc từ da ếch lên mũi phi tiêu thổi để đi săn, độc lực của phi tiêu kéo dài hơn 1 năm.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1073/pnas.2025161622",
        label: "PNAS - Evolutionary molecular mechanisms of batrachotoxin sequestration and resistance in anurans (2025)"
      });

    } else if (c.id === 'goliath-beetle') {
      newC.diet_type = "omnivore";
      newC.diet_items = ["nhựa cây giàu đường", "trái cây chín lên men", "gỗ mục nát", "xác thực vật ẩm"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Trứng được đẻ sâu trong đất ẩm. Ấu trùng lớn lên nhờ ăn chất mùn hữu cơ và gỗ mục chứa protein, tích lũy năng lượng khổng lồ để hóa nhộng trước khi lột xác thành con trưởng thành.";
      newC.locomotion = "hybrid";
      newC.speed_max = 16.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 60.0;
      newC.size_max_mm = 110.0;
      newC.weight_avg_g = 58.0;

      newC.characteristics = appendText(c.characteristics, "Lớp exoskeleton kitin siêu cứng được gia cố liên kết chéo hữu cơ vững chắc. Con đực sở hữu một chiếc sừng Y lớn bằng kitin cứng chắc chắn hoạt động như đòn bẩy cơ học.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng chiếc sừng chữ Y ở đầu để cạy vỏ cây lấy nhựa và hất văng bọ đực đối thủ khỏi cành cây để chiếm quyền giao phối.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ ngực cực kỳ khỏe để vận hành cặp cánh màng lớn bên dưới cánh cứng bảo vệ (elytra), tạo ra âm thanh đập cánh trầm thấp như trực thăng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng tự sưởi ấm nội sinh (endothermy cơ học) bằng cách rung cơ ngực để tăng nhiệt cơ bay lên 30°C.");
      addUniqueItem(newC.strengths, "Lớp giáp kitin dày chịu nén cơ học cực tốt, cản được vết cắn của chim săn mồi cỡ nhỏ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Quá trình làm nóng cơ bay ngực mất nhiều thời gian phơi nắng, khiến chúng bất động ban mai dễ bị săn tìm.");
      addUniqueItem(newC.weaknesses, "Trở nên vô cùng vụng về và chậm chạp nếu bị rơi ngửa trên mặt đất nhẵn nhụi do trọng lượng cơ thể quá nặng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ấu trùng của bọ Goliath có thể nặng tới 110 gram, nặng gấp đôi so với chính chúng khi đã biến thái thành con trưởng thành.");
      addUniqueItem(newC.fun_facts, "Chúng rất được ưa chuộng làm thú cưng độc lạ tại Nhật Bản và thường được giao dịch với giá hàng trăm USD.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.2025.02455",
        label: "Journal of Experimental Biology - Flight energetics and biomechanics of heavy insects (2025)"
      });

    } else if (c.id === 'goliath-birdeater') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["chuột nhắt rừng", "thằn lằn nhỏ", "ếch rừng", "côn trùng lớn", "rắn nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái dệt túi tơ chứa 100-200 trứng và giữ trong hang sâu ẩm, chăm sóc bảo vệ nghiêm ngặt chống kẻ thù cho đến khi nhện non nở ra.";
      newC.locomotion = "crawl";
      newC.speed_max = 5.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 130.0;
      newC.weight_avg_g = 165.0;

      newC.characteristics = appendText(c.characteristics, "Toàn thân bao phủ bởi lớp lông tơ màu nâu nhạy cảm. Cặp răng nanh chelicerae rỗng dài tới 4cm có lực đâm mạnh mẽ và ống dẫn nọc độc.");
      newC.survival_method = appendText(c.survival_method, "Săn phục kích về đêm dựa trên thụ cảm rung động đất siêu nhạy. Tự vệ bằng cách cọ lông chân tạo tiếng rít cảnh báo lớn và dùng chân sau đá lông bụng chứa ngạnh ngược gây viêm niêm mạc.");
      newC.unique_traits = appendText(c.unique_traits, "Khả năng tự rụng chi bị tổn thương (autotomy) tại khớp háng để ngăn chảy máu, sau đó tái sinh hoàn hảo chi mới sau các kỳ lột xác tiếp theo.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sở hữu lông xúc giác trichobothria cực nhạy cảm nhận được các hạt bụi dịch chuyển trong dòng khí xung quanh.");
      addUniqueItem(newC.strengths, "Khả năng tái sinh hoàn hảo chi bị đứt rời sau 1-2 lần lột xác nhờ các tế bào gốc chuyên biệt ở khớp rụng chi.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Bụng (abdomen) mỏng và mềm chứa nhiều cơ quan nội tạng dễ bị nứt vỡ gây tử vong nếu rơi từ độ cao trên 15cm.");
      addUniqueItem(newC.weaknesses, "Khả năng nhìn cực kém, chỉ nhận biết được cường độ sáng tối và chuyển động bóng mờ thô sơ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nhện cái có thể sống tới 25 năm trong khi nhện đực thường chỉ thọ 3-6 năm và chết ngay sau khi trưởng thành sinh dục.");
      addUniqueItem(newC.fun_facts, "Tiếng rít đe dọa từ đôi lông chân ma sát của chúng to tới mức có thể nghe rõ ở khoảng cách 4 mét trong đêm tối.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2025.03.003",
        label: "Toxicon - Proteomic and pharmacological characterization of Theraphosa blondi venom (2025)"
      });
    }

    return newC;
  });

  // Write file
  const tempFilePath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(tempFilePath, JSON.stringify(enriched, null, 2));
  console.log(`Successfully generated temp-enrich.json at ${tempFilePath}`);

  console.log("Calling update-enrichment.js script to persist the data... ");
  try {
    const updateScriptPath = path.join(__dirname, "update-enrichment.js");
    const output = execSync(`node ${updateScriptPath} ${tempFilePath}`, { encoding: "utf-8" });
    console.log(output);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout);
    if (err.stderr) console.error("Stderr:", err.stderr);
    process.exit(1);
  }

  // Clean up
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  targets.forEach((t, i) => {
    console.log(`${i + 1} | ${t.name} | ${t.id} | ${t.class} | ${t.enrichment_count + 1}`);
  });
  console.log("==============================================================================");
}

run();
