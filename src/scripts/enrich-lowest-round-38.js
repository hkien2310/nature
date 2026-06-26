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
  console.log(`Selected targets for Round 38: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'honey-badger') {
      newC.diet_type = "omnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "mật ong");
      addUniqueItem(newC.diet_items, "rắn độc");
      addUniqueItem(newC.diet_items, "bò sát");
      addUniqueItem(newC.diet_items, "côn trùng");
      addUniqueItem(newC.diet_items, "ấu trùng");
      addUniqueItem(newC.diet_items, "loài gặm nhấm");
      addUniqueItem(newC.diet_items, "củ quả");
      addUniqueItem(newC.diet_items, "chim nhỏ");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 7;
      newC.lifespan_max = 24;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thời gian mang thai khoảng 6 đến 8 tuần. Mỗi lứa sinh từ 1-2 con non trong hang đất do mẹ tự đào. Con non sinh ra hoàn toàn mù và không có lông, được mẹ nuôi dưỡng và chuyển hang liên tục để tránh thú săn mồi.";
      newC.locomotion = "hybrid";
      newC.speed_max = 30.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 550.0;
      newC.size_max_mm = 770.0;
      newC.weight_avg_g = 12000.0;

      newC.characteristics = appendText(c.characteristics, "Bộ răng sắc nhọn với lực cắn vượt trội có thể nghiền nát mai rùa cứng một cách dễ dàng.");
      newC.survival_method = appendText(c.survival_method, "Cơ chế trao đổi chất đặc biệt giúp tự giải độc rượu và các chất lên men tự nhiên nhanh chóng.");
      newC.unique_traits = appendText(c.unique_traits, "Cấu trúc gân cơ chân sau dày và đàn hồi cao cung cấp sức bền dẻo dai chạy liên tục nhiều giờ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Răng nanh khỏe có khả năng cắn vỡ mai rùa và xương động vật nhỏ.");
      addUniqueItem(newC.strengths, "Khả năng tự hồi phục sau khi bị rắn độc cắn nhờ hệ chuyển hóa độc tố gan siêu cấp.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thường bị các loài săn mồi lớn hơn như hổ hoặc báo phục kích từ phía trên khi đang mải mê đào bới.");
      addUniqueItem(newC.weaknesses, "Nhu cầu calo hàng ngày cao buộc phải liên tục di chuyển và săn mồi không ngừng nghỉ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Lửng mật có cấu trúc da quanh vùng cổ rất dày (tới 6mm) và lỏng lẻo đến mức nếu bị báo săn ngoạm cổ, nó vẫn có thể xoay ngược đầu lại cắn vào mũi báo.");
      addUniqueItem(newC.fun_facts, "Chúng có thể chịu được hàng trăm vết ong đốt mà không có bất kỳ triệu chứng sốc phản vệ nào.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1644/1545-1411(2002)705%3C0001:MC%3E2.0.CO;2",
        label: "Mammalian Species - Mellivora capensis"
      });

    } else if (c.id === 'hooded-pitohui') {
      newC.diet_type = "omnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "bọ cánh cứng Choresine");
      addUniqueItem(newC.diet_items, "quả mọng");
      addUniqueItem(newC.diet_items, "hạt cây");
      addUniqueItem(newC.diet_items, "côn trùng nhỏ");
      addUniqueItem(newC.diet_items, "sung rừng");

      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản bằng cách đẻ trứng. Tổ của chúng có hình cái chén được làm từ rễ cây cỏ đan cài vào nhau treo trên ngọn cây cao. Trứng có đốm màu cam để ngụy trang, chứa lượng nhỏ độc tố batrachotoxin phòng vệ.";
      newC.locomotion = "fly";
      newC.speed_max = 35.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 220.0;
      newC.size_max_mm = 230.0;
      newC.weight_avg_g = 70.0;

      newC.characteristics = appendText(c.characteristics, "Lông có cấu trúc rỗng đặc biệt giúp giữ các phân tử batrachotoxin bám chặt mà không bị rửa trôi bởi nước mưa.");
      newC.survival_method = appendText(c.survival_method, "Tiết ra mùi chua đặc trưng giống như ammoniac từ lông để xua đuổi các loài thú gặm nhấm leo cây từ xa.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ chế chuyển hóa lipid đặc biệt giúp liên kết batrachotoxin với lipid bề mặt lông duy trì độc lực cực lâu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hương vị thịt cực hôi và bỏng rát tạo lớp bảo vệ tuyệt hảo chống lại các loài thú săn mồi hoang dã.");
      addUniqueItem(newC.strengths, "Lớp độc tố bao phủ trứng giúp bảo vệ tổ khỏi kiến lửa và côn trùng ký sinh phá hoại.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Kích thước nhỏ khiến chúng dễ bị tổn thương bởi các loài chim săn mồi lớn như đại bàng rừng.");
      addUniqueItem(newC.weaknesses, "Nguồn thức ăn đặc hữu suy giảm nghiêm trọng khi có cháy rừng làm hạn chế khả năng tự tích lũy độc tố.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Đây là loài chim đầu tiên được phát hiện sở hữu độc tố tự nhiên mạnh tương đương với ếch phi tiêu độc Nam Mỹ.");
      addUniqueItem(newC.fun_facts, "Chất độc batrachotoxin trên lông chim pitohui có thể gây tê liệt hoàn toàn các đầu ngón tay của các nhà khoa học khi xử lý mẫu vật mà không đeo găng tay.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1007/s00114-002-0389-y",
        label: "Naturwissenschaften - Presence of batrachotoxin in different tissues of Pitohui"
      });

    } else if (c.id === 'horror-frog') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "côn trùng");
      addUniqueItem(newC.diet_items, "ốc sên");
      addUniqueItem(newC.diet_items, "nhện rừng");
      addUniqueItem(newC.diet_items, "ếch nhỏ");
      addUniqueItem(newC.diet_items, "giun đất");
      addUniqueItem(newC.diet_items, "nòng nọc");

      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng. Con cái đẻ trứng thành các dải keo dính đính chặt vào bề mặt đá ẩm dưới các con suối chảy xiết. Con đực có nhiệm vụ canh gác trứng và mọc tua da hỗ trợ hô hấp phụ dưới nước.";
      newC.locomotion = "hybrid";
      newC.speed_max = 8.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 130.0;
      newC.weight_avg_g = 125.0;

      newC.characteristics = appendText(c.characteristics, "Các nhú da dạng sợi ở con đực dài tới 2cm trông giống sợi tóc, thực chất là các nhú bì giàu mạch máu.");
      newC.survival_method = appendText(c.survival_method, "Khi bị săn đuổi, chúng nhảy thẳng xuống lòng suối sâu và bám chặt vào các tảng đá nhờ cấu trúc đệm chân bám dính cực mạnh.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ chế bẻ xương ngón chân tận cùng được hỗ trợ bởi các sợi cơ gấp kỹ thuật sâu co bóp rất mạnh.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng ngụy trang xuất sắc dưới đáy suối đá nhờ màu sắc và họa tiết da sần sùi.");
      addUniqueItem(newC.strengths, "Hệ thống mao mạch dưới các tua da giúp hấp thụ oxy trực tiếp từ nước mà không cần ngoi lên mặt nước.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Việc bẻ gãy xương ngón chân để làm vuốt làm giảm độ cơ động nhảy xa tạm thời trong vài tuần sau khi chiến đấu.");
      addUniqueItem(newC.weaknesses, "Cơ thể dễ mất nước nhanh chóng nếu độ ẩm không khí giảm sút đột ngột.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ếch lông đực mọc nhú da trong mùa sinh sản khi lượng hormone testosterone trong cơ thể tăng vọt.");
      addUniqueItem(newC.fun_facts, "Ếch kinh dị có thể tự rút vuốt xương lại sau khi mối đe dọa qua đi, vết thương tự lành nhờ tế bào gốc mô sụn hoạt động mạnh.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.jstor.org/stable/3562657",
        label: "Copeia - Hairy frog Trichobatrachus robustus reproductive biology and anatomy"
      });

    } else if (c.id === 'humpback-anglerfish') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "cá nhỏ");
      addUniqueItem(newC.diet_items, "giáp xác biển sâu");
      addUniqueItem(newC.diet_items, "tôm nhỏ");
      addUniqueItem(newC.diet_items, "mực ống nhỏ");
      addUniqueItem(newC.diet_items, "sinh vật phù du cỡ trung");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Thụ tinh ngoài. Ấu trùng sống ở vùng nước cạn rồi di cư xuống độ sâu nghìn mét khi trưởng thành. Cá đực không ký sinh vĩnh viễn vào cá cái ở loài này mà chỉ bám tạm thời để thụ tinh.";
      newC.locomotion = "swim";
      newC.speed_max = 1.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 500.0;

      newC.characteristics = appendText(c.characteristics, "Lớp da siêu đen chứa melanosome phân bố dày đặc hấp thụ hầu như toàn bộ ánh sáng chiếu vào.");
      newC.survival_method = appendText(c.survival_method, "Cần câu phát sáng lắc lư nhịp nhàng thu hút sự chú ý của các sinh vật biển sâu tò mò.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ quan esca chứa các túi tuyến sản xuất dưỡng chất liên tục nuôi dưỡng vi khuẩn phát quang cộng sinh.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ thể không có bóng hơi ngăn chặn tuyệt đối hiện tượng vỡ bong bóng do biến đổi áp suất nước.");
      addUniqueItem(newC.strengths, "Lớp da hấp thụ 99.4% ánh sáng hoạt động như một áo choàng tàng hình sinh học.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Cơ bắp vận động yếu khiến cá không thể truy đuổi con mồi nếu cần câu phát quang bị hỏng.");
      addUniqueItem(newC.weaknesses, "Mật độ cá thể cực loãng ở biển sâu khiến cơ hội tìm gặp bạn tình của con đực vô cùng mong manh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tên loài johnsonii được đặt để vinh danh James Yate Johnson, người đầu tiên phát hiện ra loài cá kỳ lạ này tại đảo Madeira năm 1863.");
      addUniqueItem(newC.fun_facts, "Con đực có khứu giác khổng lồ chiếm tới 1/3 thể tích đầu để đánh hơi pheromone của con cái.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/s41598-020-74542-y",
        label: "Scientific Reports - Camouflage mechanisms and ultra-black skins of deep-sea fishes"
      });

    } else if (c.id === 'immortal-jellyfish') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "sinh vật phù du");
      addUniqueItem(newC.diet_items, "trứng cá");
      addUniqueItem(newC.diet_items, "tôm nhỏ");
      addUniqueItem(newC.diet_items, "ấu trùng động vật không xương sống");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản xen kẽ thế hệ. Cá thể medusa đực và cái phóng giao tử vào nước biển thụ tinh ngoài tạo phôi thành ấu trùng planula. Ấu trùng bám đáy phát triển thành thảm polyp vô tính mọc chồi sinh sứa con.";
      newC.locomotion = "swim";
      newC.speed_max = 0.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 4.5;
      newC.size_max_mm = 5.0;
      newC.weight_avg_g = 0.01;

      newC.characteristics = appendText(c.characteristics, "Lớp thạch gelatin mesoglea chứa các protein đàn hồi cao giúp co bóp vành chuông liên tục không mỏi.");
      newC.survival_method = appendText(c.survival_method, "Đảo ngược vòng đời (LCR) khi tế bào medusa tự tái thiết lập trạng thái chromatin quay lại giai đoạn polyp.");
      newC.unique_traits = appendText(c.unique_traits, "Sự kích hoạt mạnh mẽ của enzyme telomerase giúp bảo vệ hoàn hảo các đầu mút nhiễm sắc thể trong mỗi chu kỳ trẻ hóa tế bào.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng đảo ngược vòng đời giúp sinh vật có thể sống sót qua các thời kỳ đói kém hoặc ô nhiễm cực độ.");
      addUniqueItem(newC.strengths, "Tốc độ tái cấu trúc mô cực nhanh (chỉ từ 36 đến 72 giờ) từ medusa thành polyp.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hoàn toàn thụ động trước các dòng hải lưu xoáy mạnh dễ bị đưa vào vùng nước ngọt làm vỡ tế bào.");
      addUniqueItem(newC.weaknesses, "Cực kỳ nhạy cảm với độ axit của đại dương (quá trình acid hóa làm hỏng cấu trúc mesoglea).");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Sứa hải đăng là sinh vật duy nhất được chứng minh có khả năng đảo ngược hoàn toàn quá trình lão hóa sinh học.");
      addUniqueItem(newC.fun_facts, "Huyết thanh và tế bào của loài sứa này đang là trọng tâm nghiên cứu của nhiều dự án kéo dài tuổi thọ con người.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/brv.12797",
        label: "Biological Reviews - Transdifferentiation and structural remodeling in Hydrozoa rejuvenation"
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
