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
  console.log(`Selected targets for Round 43: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'olm') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "ốc ngầm");
      addUniqueItem(newC.diet_items, "giáp xác nhỏ (amphipods)");
      addUniqueItem(newC.diet_items, "ấu trùng côn trùng");
      addUniqueItem(newC.diet_items, "giun đất ngầm");
      addUniqueItem(newC.diet_items, "côn trùng hang động");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 58;
      newC.lifespan_max = 100;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng ngầm dưới nước (oviparous), bám dính dưới mặt đá ẩm. Một lứa gồm khoảng 30 đến 70 quả trứng được thụ tinh trong và có thời gian ấp kéo dài tới 180 ngày tùy thuộc vào nhiệt độ nước lạnh ổn định từ 8-12°C.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.8;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 18.0;

      newC.characteristics = appendText(c.characteristics, "Hệ thống xương sọ dẹt đặc biệt giúp truyền sóng âm trực tiếp từ nước đá vôi đến tai trong mà không cần màng nhĩ ngoài.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng sửa chữa đứt gãy DNA mạch đôi với tốc độ nhanh nhờ sự kích hoạt tích cực của protein p53 độc hữu.");
      addUniqueItem(newC.strengths, "Sự tích lũy glycogen và lipid mật độ cao ở gan giúp duy trì chuyển hóa tối giản.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thiếu hụt hoàn toàn sắc tố melanin bảo vệ khiến chúng bị bỏng và hủy hoại tế bào da nhanh chóng dưới ánh sáng mặt trời.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Mắt của kỳ nhông Olm biến mất dưới da khi chúng lớn lên, nhưng chúng vẫn sở hữu các tế bào thụ cảm ánh sáng trên toàn bộ làn da để nhận biết vùng sáng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsbl.2009.1013",
        label: "Biology Letters - Longevity of Proteus anguinus"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1371/journal.pone.0228372",
        label: "PLOS ONE - Site fidelity in Proteus anguinus"
      });

    } else if (c.id === 'olm-salamander') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "giáp xác hang động (isopods)");
      addUniqueItem(newC.diet_items, "ấu trùng phù du");
      addUniqueItem(newC.diet_items, "ốc sên nước nhỏ");
      addUniqueItem(newC.diet_items, "giun ngầm");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 55;
      newC.lifespan_max = 100;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Là loài đẻ trứng dưới các kẽ đá hang động ngầm. Chu kỳ sinh sản diễn ra cực kỳ thưa thớt, khoảng từ 6 đến 12 năm mới đẻ trứng một lần. Thời gian ấp trứng kéo dài từ 2 đến 6 tháng tùy nhiệt độ môi trường.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.5;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 17.5;

      newC.characteristics = appendText(c.characteristics, "Tuyến dịch nhầy biểu bì dồi dào các peptide kháng khuẩn giúp ngăn ngừa các bào tử nấm và vi khuẩn cơ hội trong hang đá ẩm ướt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng neoteny (ấu trùng vĩnh viễn) cho phép giữ lại mang ngoài lông vũ đỏ thẫm suốt đời để lấy oxy tối đa từ nước tĩnh.");
      addUniqueItem(newC.strengths, "Cảm nhận chấn động thủy động học thông qua cơ quan đường bên phát triển dọc thân.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có cơ chế tự vệ chủ động, hoàn toàn phụ thuộc vào việc ẩn nấp sâu trong các hang đá karst chật hẹp.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Kỳ giông Olm không có nhịp sinh học ngày đêm do sống trong môi trường hang tối vĩnh viễn không có mặt trời.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1186/s12864-021-07612-4",
        label: "BMC Genomics - Extreme genomic repeats and DNA repair mechanisms"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.3389/fevo.2020.00162",
        label: "Frontiers in Ecology and Evolution - Behavior of Proteus anguinus"
      });

    } else if (c.id === 'orca') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cá hồi Chinook");
      addUniqueItem(newC.diet_items, "hải cẩu cảng");
      addUniqueItem(newC.diet_items, "cá đuối");
      addUniqueItem(newC.diet_items, "cá mập trắng");
      addUniqueItem(newC.diet_items, "mực đại dương");
      addUniqueItem(newC.diet_items, "cá voi sừng tấm non");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 90;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Thời kỳ mang thai kéo dài từ 15 đến 18 tháng, đẻ một con non duy nhất. Con non được nuôi dưỡng bằng sữa mẹ giàu béo (chứa tới 30-40% chất béo) trong khoảng 12 đến 24 tháng.";
      newC.locomotion = 'swim';
      newC.speed_max = 56.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 6000.0;
      newC.size_max_mm = 8000.0;
      newC.weight_avg_g = 4500000.0;

      newC.characteristics = appendText(c.characteristics, "Hệ thống cơ quan hô hấp có dung tích phế quản cực đại cho phép hấp thụ tới 90% lượng oxy trong mỗi nhịp thở (so với 15% ở người).");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lớp mỡ blubber dày tới 15 cm đóng vai trò cách nhiệt hoàn hảo và cung cấp nguồn năng lượng dự trữ dồi dào.");
      addUniqueItem(newC.strengths, "Khả năng phối hợp bầy đàn đồng bộ bằng hệ thống sonar có tần số phát sóng cực rộng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sự tích tụ độc chất sinh học (biomagnification) qua chuỗi thức ăn khiến chúng dễ bị suy yếu hệ miễn dịch do nhiễm PCB và kim loại nặng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Orca là một trong số cực kỳ hiếm hoi các loài động vật có trải qua giai đoạn mãn kinh sinh học, giúp con cái lớn tuổi tập trung dẫn dắt đàn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rspb.2015.0233",
        label: "Proceedings of the Royal Society B - Post-reproductive lifespan in killer whales"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/mms.12845",
        label: "Marine Mammal Science - Pod structure and foraging ecology of Orcas"
      });

    } else if (c.id === 'orchid-mantis') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "ong mật châu Á");
      addUniqueItem(newC.diet_items, "ruồi trâu");
      addUniqueItem(newC.diet_items, "bướm đêm");
      addUniqueItem(newC.diet_items, "ong bắp cày");
      addUniqueItem(newC.diet_items, "chuồn chuồn rừng");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Sau khi giao phối, con cái tạo túi bọt trứng xốp (ootheca) bám dính dưới lá cây hoặc cành nhỏ chứa từ 50 đến 150 trứng. Trứng nở thành ấu trùng (nymph) sau khoảng 45 ngày.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 25.0;
      newC.size_max_mm = 70.0;
      newC.weight_avg_g = 1.0;

      newC.characteristics = appendText(c.characteristics, "Sự dị hình kích thước giới tính mạnh mẽ giúp tối ưu hóa cấu trúc cơ sinh học: con cái lớn gấp đôi để tích lũy dinh dưỡng cho trứng, con đực nhỏ gọn để dễ bay đi tìm kiếm bạn tình.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Mắt kép có tầm nhìn lập thể 3D góc rộng kết hợp vùng nhạy cảm fovea giúp ước lượng cự ly vồ mồi chính xác đến từng milimet.");
      addUniqueItem(newC.strengths, "Biểu bì cánh giả hoa phản xạ tia UV mạnh tạo ảo ảnh thị giác dụ côn trùng tự bay đến.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Quá trình lột xác (ecdysis) cực kỳ nguy hiểm, chúng rất dễ bị rách da hoặc kẹt trong lớp vỏ cũ nếu độ ẩm rừng mưa giảm thấp.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ấu trùng bọ ngựa phong lan ở những giai đoạn đầu có màu đen đỏ rực rỡ để bắt chước loài bọ xít có độc, một hình thức ngụy trang xua đuổi kẻ thù.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1086/715424",
        label: "The American Naturalist - Evolution of flower mimicry in mantids"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.237271",
        label: "Journal of Experimental Biology - Visual systems of orchid mantis"
      });

    } else if (c.id === 'pacific-blackdragon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cá đèn (myctophids)");
      addUniqueItem(newC.diet_items, "tôm krill");
      addUniqueItem(newC.diet_items, "giáp xác chân chèo");
      addUniqueItem(newC.diet_items, "cá quỷ biển sâu");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng ra nước đại dương sâu (oviparous). Phôi trứng trôi nổi tự do trong dòng nước sâu. Trải qua sự dị hình giới tính cực độ: con đực đạt trưởng thành sinh dục chỉ sau vài tháng và thiếu hoàn toàn hệ tiêu hóa hoạt động.";
      newC.locomotion = 'swim';
      newC.speed_max = 7.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 80.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu khớp cổ linh hoạt phi thường với đốt sống cổ thứ nhất tiêu giảm, cho phép ngửa đầu lên 90 độ để nuốt trọn con mồi có kích thước lớn.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hắc sắc tố melanosome trên biểu bì được sắp xếp lớp xếp chồng hoàn hảo, hấp thụ tới 99.5% ánh sáng lục-lam phổ biến ở biển sâu.");
      addUniqueItem(newC.strengths, "Cơ quan phát quang sinh học phát ánh sáng đỏ hồng ngoại (650-700nm) giúp quan sát con mồi mà không đánh động các sinh vật mù ánh sáng đỏ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thiếu cấu trúc xương sườn lớn nâng đỡ khiến cơ thể dễ bị biến dạng và tổn thương nặng dưới tác động cơ học đột ngột.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ấu trùng cá rồng đen sở hữu hai mắt nằm ngoài cuống dài tới 1/3 chiều dài thân, những cuống mắt này sẽ thu gọn và tiêu biến khi chúng di cư xuống độ sâu vĩnh viễn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cub.2020.06.044",
        label: "Current Biology - Ultra-black skin camouflage in deep-sea fishes"
      });
      addSource(newC.sources, {
        url: "https://www.nature.com/articles/ncomms14865",
        label: "Nature Communications - Optical properties of deep-sea dragonfish teeth"
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
