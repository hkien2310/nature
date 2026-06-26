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
  console.log(`Selected targets for Round 48: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'saltwater-crocodile') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá", "chim", "thú hoang", "lợn rừng", "nai", "trâu nước", "cua", "cá mập nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 70;
      newC.lifespan_max = 100;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đắp tổ bằng lá cây mục để tạo nhiệt lượng ấp trứng, đẻ từ 40 đến 60 quả trứng. Giới tính của con non được quyết định bởi nhiệt độ trong tổ (nhiệt độ 31.6°C cho ra tỷ lệ con đực cao nhất).';
      newC.locomotion = 'hybrid';
      newC.speed_max = 29.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 4300.0;
      newC.size_max_mm = 6000.0;
      newC.weight_avg_g = 650000.0;

      newC.characteristics = appendText(c.characteristics, "Lớp da lưng bọc xương cứng chứa cấu trúc osteoderms giúp phân tán lực tác động từ vũ khí đối phương và hấp thụ nhiệt lượng mặt trời.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng lực đẩy đuôi cực đại tạo gia tốc đột ngột, phóng thân lên khỏi mặt nước tóm gọn mồi trên bờ.");
      newC.unique_traits = appendText(c.unique_traits, "Hệ thống enzyme tiêu hóa mạnh đến mức có thể hòa tan xương, sừng và thậm chí cả mai rùa.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sở hữu lực cắn cơ học mạnh nhất trong các sinh vật hiện đại.");
      addUniqueItem(newC.strengths, "Khả năng tàng hình phục kích hoàn hảo nhờ cơ chế bơi không tạo sóng nước.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sự mệt mỏi và cứng cơ do tích tụ axit lactic cực nhanh sau khi vận động kỵ khí kịch liệt.");
      addUniqueItem(newC.weaknesses, "Cơ mở hàm cực yếu dễ bị vô hiệu hóa bởi lực ép cơ học đơn giản.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Có thể bơi hàng nghìn kilomet băng đại dương bằng cách thả mình theo các dòng hải lưu lớn.");
      addUniqueItem(newC.fun_facts, "Sử dụng đá cuội trong dạ dày làm cối xay nghiền thức ăn và làm vật giữ thăng bằng khi chìm lặn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1371/journal.pone.0031781",
        label: "PLOS ONE - Bite Force and Evolutionary Diversification of Crocodilians"
      });

    } else if (c.id === 'sand-tiger-shark') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá tầng đáy", "cá đuối", "cá mập nhỏ", "mực", "cua", "tôm"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 40;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Noãn thai sinh (ovoviviparous) với hiện tượng ăn thịt đồng loại trong tử cung (intrauterine cannibalism). Phôi thai phát triển đầu tiên sẽ ăn thịt các phôi thai khác và trứng chưa thụ tinh để tích lũy dưỡng chất.';
      newC.locomotion = 'swim';
      newC.speed_max = 40.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 3200.0;
      newC.weight_avg_g = 125000.0;

      newC.characteristics = appendText(c.characteristics, "Hệ thống vảy răng cưa siêu nhỏ (placoid scales) bao phủ khắp thân giúp giảm lực cản và triệt tiêu tiếng động khi di chuyển.");
      newC.survival_method = appendText(c.survival_method, "Bơi lơ lửng tĩnh lặng bất động nhờ kiểm soát dung tích khí trong dạ dày để ngụy trang săn mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Là loài cá mập duy nhất có thể nuốt không khí mặt nước làm 'phao phổi' điều hòa sức nổi.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phát hiện dòng điện sinh học cực yếu dưới 0.01 microvolt từ con mồi trốn dưới cát.");
      addUniqueItem(newC.strengths, "Hàm răng nhọn hoắt liên tục mọc thay thế dạng băng chuyền cứ mỗi 48 giờ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có khả năng bơi lùi do cấu tạo vây ngực cứng, dễ bị kẹt trong các khe đá hẹp.");
      addUniqueItem(newC.weaknesses, "Tỷ lệ sinh sản cực thấp do hiện tượng sinh tồn khốc liệt trong bụng mẹ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Có thể phát ra tiếng ợ hơi lớn để xả bớt không khí trong dạ dày nhằm chìm nhanh trốn kẻ thù.");
      addUniqueItem(newC.fun_facts, "Dù vẻ ngoài rất dữ tợn với bộ răng chìa ra ngoài, chúng cực kỳ điềm tĩnh và hiếm khi tấn công thợ lặn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.scientificamerican.com/article/shark-embryo-cannibalism/",
        label: "Scientific American - Intrauterine Cannibalism in Sand Tiger Sharks"
      });

    } else if (c.id === 'sarcastic-fringehead') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giáp xác", "trứng cá", "mực nhỏ", "cá nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đẻ trứng bên trong các hang hốc trống, vỏ ốc, ống phế thải, sau đó con đực bảo vệ trứng cực kỳ nghiêm ngặt.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 150.0;

      newC.characteristics = appendText(c.characteristics, "Khớp hàm có tính đàn hồi cao liên kết với hệ thống xương sọ dày bọc lớp sụn hấp thụ xung lực khi va chạm đọ miệng.");
      newC.survival_method = appendText(c.survival_method, "Chiếm giữ các hốc đá hoặc vỏ ốc rỗng, bảo vệ lãnh thổ quyết liệt bằng cách há to miệng đe dọa.");
      newC.unique_traits = appendText(c.unique_traits, "Tập tính đọ kích cỡ quai hàm (mouth-wrestling) để giải quyết tranh giành lãnh thổ mà không cần cắn xé chảy máu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Quai hàm mở rộng khổng lồ gấp 4 lần sọ thông thường viền màng huỳnh quang rực rỡ.");
      addUniqueItem(newC.strengths, "Hệ xương đầu cực cứng chống chịu chấn động mạnh khi giao chiến.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có bong bóng cá khiến khả năng duy trì thăng bằng trong tầng nước mở rất kém.");
      addUniqueItem(newC.weaknesses, "Cực kỳ dễ tổn thương và mất khả năng phòng vệ nếu bị ép rời khỏi hang bảo vệ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng cực kỳ yêu thích các loại vỏ chai thủy tinh và ống sắt phế thải nhân tạo để làm nhà.");
      addUniqueItem(newC.fun_facts, "Có cái tên 'châm biếm' do gương mặt lúc nào cũng cau có và cái miệng mở ngoác kỳ dị.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1371/journal.pone.0000321",
        label: "PLOS ONE - Biomechanics of jaw expansion in Neoclinus blanchardi"
      });

    } else if (c.id === 'satanic-leaf-tailed-gecko') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế", "ngài", "gián", "ruồi", "nhện", "ốc sên nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Sau mùa mưa, con cái đẻ từ 2 quả trứng hình cầu xuống lớp lá mục ẩm hoặc chôn nông dưới cát mục.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 66.0;
      newC.size_max_mm = 90.0;
      newC.weight_avg_g = 15.0;

      newC.characteristics = appendText(c.characteristics, "Màng sừng bảo vệ mắt trong suốt tự làm sạch bằng lưỡi, cùng các gai nhọn như sừng quỷ trên đầu tăng tính ngụy trang.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng bước đi ngắt quãng mô phỏng nhịp đung đưa của lá khô trước gió để đánh lừa con mắt kẻ săn mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Thị lực đêm siêu việt gấp 350 lần mắt người nhờ hệ thống tế bào hình que cực kỳ cô đặc.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Ngụy trang hình thái lá mục ở mức độ tinh vi nhất tự nhiên bao gồm đốm rêu mục giả.");
      addUniqueItem(newC.strengths, "Lực liên kết van der Waals ở đệm chân giúp bám chắc trên mọi bề mặt trơn nhẵn.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không chịu nổi nhiệt độ trên 26°C hoặc độ ẩm dưới 50%, cơ thể suy kiệt rất nhanh.");
      addUniqueItem(newC.weaknesses, "Đuôi lá sau khi rụng tái sinh sẽ không bao giờ đạt được chi tiết ngụy trang hoàn hảo như cũ.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng hoàn toàn không có mí mắt và bắt buộc phải liếm nhãn cầu để làm sạch mắt.");
      addUniqueItem(newC.fun_facts, "Có thể cuộn tròn toàn bộ cơ thể lại như một chiếc lá rụng tự do để rơi thẳng xuống đất lẩn trốn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1469-7998.2009.00662.x",
        label: "Journal of Zoology - Visual performance and spectral sensitivity of Uroplatus geckos"
      });

    } else if (c.id === 'scaly-foot-gastropod') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["khí sulfur", "hydro sulfide", "khoáng chất hòa tan", "vi khuẩn hóa tổng hợp"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đồng thời (simultaneous hermaphrodites). Tuyến sinh dục đực và cái phát triển cùng lúc, sinh sản qua thụ tinh chéo với cá thể khác.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 12.5;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc vảy chân phủ sunfua sắt greigite từ tính sắp xếp chồng lớp như áo giáp xích thời trung cổ.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng dòng đối lưu nước nhiệt cực mạnh để đưa khí độc hydrogen sulfide đi qua tuyến thực quản nuôi dưỡng vi khuẩn nội bào.");
      newC.unique_traits = appendText(c.unique_traits, "Sinh vật duy nhất trên thế giới kết hợp trực tiếp hợp chất sắt từ tính vào bộ xương ngoài.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lớp vỏ 3 lớp giảm chấn thương cơ học với đệm spongin triệt tiêu năng lượng va đập.");
      addUniqueItem(newC.strengths, "Khả năng kháng nồng độ độc chất H2S cao gấp trăm lần ngưỡng tử vong của động vật thông thường.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Phạm vi sinh tồn cực hẹp, tử vong ngay lập tức nếu rời khỏi các miệng phun thủy nhiệt biển sâu.");
      addUniqueItem(newC.weaknesses, "Hoàn toàn bất động và không thể di chuyển nhanh nếu bị chôn vùi dưới cặn hoặc bùn đáy.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Bộ giáp sắt greigite của chúng có từ tính thực sự và có thể bị hút dính vào nam châm.");
      addUniqueItem(newC.fun_facts, "Trái tim của chúng có kích thước cực lớn, chiếm tới 4% khối lượng cơ thể để luân chuyển oxy nuôi vi khuẩn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/s41564-020-0702-9",
        label: "Nature Microbiology - Genome of the scaly-foot snail provides insights into hydrothermal vent adaptation"
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
