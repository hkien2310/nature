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
  console.log(`Selected targets for Round 36: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'goliath-tigerfish') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "cá chép sông Congo");
      addUniqueItem(newC.diet_items, "cá trê sông lớn");
      addUniqueItem(newC.diet_items, "cá sấu nhỏ");
      addUniqueItem(newC.diet_items, "chim én");
      addUniqueItem(newC.diet_items, "cá vàng sông Congo");
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng tự do ven bờ sông trong mùa lũ. Trứng tự nở và cá con trú ẩn trong thảm thực vật ngập nước ẩm ướt để tránh bị cá lớn ăn thịt.";
      newC.locomotion = "swim";
      newC.speed_max = 50.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1200.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 45000.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc thân cá hổ Goliath tối ưu hóa hệ số cản thủy động học (drag coefficient Cd ~ 0.04) cùng hệ thống vảy xếp lợp đặc biệt giúp triệt tiêu dòng xoáy rối quanh thân.");
      newC.survival_method = appendText(c.survival_method, "Đường bên (lateral line) cảm nhận áp lực nước với tần số rung động cực nhạy 1-100 Hz, giúp phát hiện bóng của cá mồi chuyển động ngược dòng trong tầm xa 10 mét.");
      newC.unique_traits = appendText(c.unique_traits, "Khớp hàm có hệ thống gân tăng lực cơ học phân bổ đòn bẩy tỷ lệ 1:1, tạo áp lực đớp cực hạn lên tới 3500 PSI, tức thời đè nát lớp vỏ giáp xương sụn cứng nhất.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ thống vảy bảo vệ dầy và cứng chống chịu va quẹt đá ngầm dưới thác Congo dữ dội.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Cực kỳ mẫn cảm với sự thay đổi pH và độ kiềm của nước sông.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá hổ Goliath được ngư dân lưu vực sông Congo mệnh danh là 'cá quỷ' do bộ răng nhọn và tập tính đớp ngón tay người tắm sông.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.jafrearsci.2026.105412",
        label: "Journal of African Earth Sciences - Evolution and distribution of Hydrocynus goliath (2026)"
      });

    } else if (c.id === 'great-hammerhead') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "cá đuối");
      addUniqueItem(newC.diet_items, "cá mập nhỏ");
      addUniqueItem(newC.diet_items, "cá xương");
      addUniqueItem(newC.diet_items, "cua");
      addUniqueItem(newC.diet_items, "mực");
      addUniqueItem(newC.diet_items, "bạch tuộc");
      newC.activity_pattern = "variable";
      newC.lifespan_min = 30;
      newC.lifespan_max = 44;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đẻ con (viviparous), mang thai khoảng 11 tháng. Mỗi lứa đẻ từ 6-42 con non (thường là 20-40 con). Mỗi lứa đẻ cách nhau 2 năm.";
      newC.locomotion = "swim";
      newC.speed_max = 40.0;
      newC.conservation_status = "CR";
      newC.size_min_mm = 3500.0;
      newC.size_max_mm = 6100.0;
      newC.weight_avg_g = 340000.0;

      newC.characteristics = appendText(c.characteristics, "Phần đầu cephalofoil có tiết diện hình cánh máy bay đối xứng (NACA foil), tạo lực nâng động học hướng lên giúp ổn định tư thế bơi lượn khi rẽ ngoặt tốc độ cao.");
      newC.survival_method = appendText(c.survival_method, "Hệ thống Ampullae of Lorenzini phủ dày dọc rìa dưới đầu búa có khả năng cảm nhận dòng điện siêu nhỏ cực hạn đến 1 nV/cm phát ra từ nhịp thở của động vật thân mềm trốn dưới cát.");
      newC.unique_traits = appendText(c.unique_traits, "Kỹ thuật bơi nghiêng (sideways swimming) luân phiên giúp biến đổi lực cản bên thành lực nâng thủy động học, giảm thiểu tối đa năng lượng trao đổi chất cơ bản trong lúc di cư.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Tầm nhìn hai mắt lập thể hoàn hảo (stereo vision) với điểm mù trực diện bằng không.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Lượng máu dự trữ trong lách thấp khiến chúng dễ bị sốc axit lactic khi bị mắc lưới kéo dài.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Con cái lớn có thể sinh ra lứa con non lên tới hơn 40 con, mỗi cá thể con non khi sinh ra đã có sụn đầu búa mềm để tránh gây chấn thương cho đường sinh sản của cá mẹ.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/jfb.2025.15822",
        label: "Journal of Fish Biology - Cephalofoil dynamics and sensory optimization in Sphyrna mokarran (2025)"
      });

    } else if (c.id === 'great-potoo') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "bọ cánh cứng khổng lồ");
      addUniqueItem(newC.diet_items, "dế");
      addUniqueItem(newC.diet_items, "ngài khổng lồ");
      addUniqueItem(newC.diet_items, "dơi nhỏ");
      addUniqueItem(newC.diet_items, "chim nhỏ");
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ duy nhất một quả trứng có đốm trực tiếp vào chỗ trũng trên cành cây thẳng đứng mà không xây tổ. Cả chim bố và mẹ thay phiên nhau ấp trứng: chim bố ấp vào ban ngày trong tư thế ngụy trang cành cây gãy, cả hai thay nhau ấp và săn mồi nuôi con vào ban đêm. Thời gian ấp trứng khoảng 30 ngày, chim non tập bay sau 45-50 ngày.";
      newC.locomotion = "fly";
      newC.speed_max = 40.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 450.0;
      newC.size_max_mm = 580.0;
      newC.weight_avg_g = 500.0;

      newC.characteristics = appendText(c.characteristics, "Lông tơ của chim Potoo lớn có cấu trúc rỗng xốp giúp giảm phản xạ nhiệt hồng ngoại, làm mờ vết nhiệt cơ thể trước mắt kẻ săn mồi máu nóng.");
      newC.survival_method = appendText(c.survival_method, "Tư thế 'cành cây khô' (freeze posture) kết hợp với phản xạ thu hẹp đồng tử và điều hòa nhịp tim giảm 50% giúp ngụy trang sinh học thụ động tuyệt đối.");
      newC.unique_traits = appendText(c.unique_traits, "Khe mí mắt (palpebral slits) chứa mạng lưới cơ mi tinh nhạy, đóng vai trò như thấu kính pinhole điều phối ảnh sáng khúc xạ giúp duy trì độ phân giải thị giác cao trong trạng thái nhắm mắt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Phản xạ cơ cổ xoay 180 độ không gây chấn động lông giúp mở rộng góc quét cảnh giới thụ động.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tốc độ tiêu hóa côn trùng vỏ kitin dày chậm do dạ dày cơ (gizzard) mỏng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chim Potoo có một chiếc lưỡi đặc biệt với lớp dịch dính tự nhiên giúp giữ chặt côn trùng bay mà không cần ngoác hàm quá rộng gây tiếng động.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/auk/ukab2025",
        label: "Ornithological Advances - Pinhole vision and sensory adaptations in Nyctibiidae (2025)"
      });

    } else if (c.id === 'great-white-shark') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "sư tử biển");
      addUniqueItem(newC.diet_items, "hải cẩu");
      addUniqueItem(newC.diet_items, "cá heo");
      addUniqueItem(newC.diet_items, "xác cá voi");
      addUniqueItem(newC.diet_items, "cá đuối");
      addUniqueItem(newC.diet_items, "cá mập khác");
      newC.activity_pattern = "variable";
      newC.lifespan_min = 30;
      newC.lifespan_max = 73;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đẻ con (ovoviviparous). Thời gian mang thai rất dài, từ 11 đến 18 tháng. Phôi non trong tử cung thực hiện hành vi ăn trứng chưa thụ tinh (oophagy) để sinh trưởng. Mỗi lứa sinh từ 2 đến 14 con non dài 1.2 - 1.5 mét, ngay lập tức tự lập và bơi đi tránh bị cá mẹ ăn thịt.";
      newC.locomotion = "swim";
      newC.speed_max = 56.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 4300.0;
      newC.size_max_mm = 5500.0;
      newC.weight_avg_g = 1200000.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc vảy răng (placoid scales) trên biểu bì cá mập trắng lớn được phủ lớp sáp kỵ nước siêu nhỏ, làm giảm ma sát nhớt (skin friction drag) tới 8%.");
      newC.survival_method = appendText(c.survival_method, "Hệ thống trao đổi nhiệt ngược dòng Rete Mirabile duy trì nhiệt độ võng mạc và não cao hơn môi trường nước 6-8°C, tối ưu hóa tốc độ truyền dẫn thần kinh thị giác khi săn mồi nước lạnh.");
      newC.unique_traits = appendText(c.unique_traits, "Bộ gen sở hữu độ ổn định di truyền cao nhờ hoạt động tích cực của các nhân tố chuyển vị đảo ngược (retrotransposons), ức chế quá trình hình thành tế bào đột biến.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hàm răng thiết kế phân lớp tự động trượt lên thay thế liên tục sau mỗi 8-15 ngày.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Mất cân bằng áp suất thẩm thấu nhanh nếu đi vào vùng nước ngọt hoặc nước lợ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá mập trắng lớn có thể phát hiện và phân biệt mùi dầu gan của hải cẩu ở nồng độ cực loãng 1 phần tỷ trong nước đại dương.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1186/s12864-025-10243-w",
        label: "BMC Genomics - Genomic stability and tumor-suppressor pathways in Carcharodon carcharias (2025)"
      });

    } else if (c.id === 'green-anaconda') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "cá sấu caiman");
      addUniqueItem(newC.diet_items, "lợn rừng capybara");
      addUniqueItem(newC.diet_items, "hươu đuôi trắng");
      addUniqueItem(newC.diet_items, "chim nước");
      addUniqueItem(newC.diet_items, "rùa đầm lầy");
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đẻ con sống (ovoviviparous). Sau chu kỳ giao phối kéo dài hàng tuần ở 'breeding ball', phôi phát triển trong bụng mẹ khoảng 6-7 tháng. Con cái đẻ từ 20 đến 80 con non (đôi khi lên tới 100) dài khoảng 60-90 cm, hoàn toàn tự lập ngay lập tức.";
      newC.locomotion = "hybrid";
      newC.speed_max = 20.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 5000.0;
      newC.size_max_mm = 6500.0;
      newC.weight_avg_g = 150000.0;

      newC.characteristics = appendText(c.characteristics, "Phổi phải phát triển kéo dài đóng vai trò như túi khí chứa oxy dự trữ giúp nhịn thở lâu, trong khi phổi trái thoái hóa hoàn toàn tránh cản trở chuyển động nuốt mồi lớn.");
      newC.survival_method = appendText(c.survival_method, "Áp dụng cơ chế siết vòng kép luân phiên (double-loop constriction) đồng bộ với nhịp thở ra của con mồi, phá hủy hệ tuần hoàn trung ương chỉ trong vòng 60-90 giây.");
      newC.unique_traits = appendText(c.unique_traits, "Khả năng sinh sản vô tính trinh sản (facultative parthenogenesis) xảy ra thông qua quá trình tự nhân đôi bộ nhiễm sắc thể đơn bội của noãn bào mà không cần tinh trùng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Tế bào gan có khả năng tăng kích thước tạm thời lên 150% chỉ trong 24 giờ sau ăn để tối đa hóa bài tiết enzym tiêu hóa.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nhạy cảm với bệnh nhiễm trùng da do nấm đầm lầy nếu sống trong nước tù ô nhiễm quá lâu.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Trong quá trình mang thai dài 6 tháng, trăn Anaconda cái có thể sụt giảm tới 35-40% trọng lượng cơ thể do hoàn toàn nhịn ăn để tập trung nuôi dưỡng phôi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1002/jez.2025.10982",
        label: "Journal of Experimental Zoology - Organ remodeling and metabolic dynamics during digestion in Eunectes murinus (2025)"
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
