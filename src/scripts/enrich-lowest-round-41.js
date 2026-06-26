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
  console.log(`Selected targets for Round 41: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'marine-iguana') {
      newC.diet_type = 'herbivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "tảo đỏ");
      addUniqueItem(newC.diet_items, "tảo lục");
      addUniqueItem(newC.diet_items, "tảo nâu");
      addUniqueItem(newC.diet_items, "thực vật biển ven bờ");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Con cái đẻ từ 1 đến 6 quả trứng vào các tổ đào bằng cát hoặc tro núi lửa. Chúng bảo vệ tổ trong vài ngày trước khi để trứng tự nở sau khoảng 3-4 tháng.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 10.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 500.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 3000.0;

      newC.characteristics = appendText(c.characteristics, "Lớp vảy sừng dày và hệ mạch máu ngoại biên co thắt mạnh dưới nước lạnh giúp duy trì nhiệt lượng lâu hơn khi lặn kiếm ăn.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng giảm 20% cấu trúc xương khi gặp nạn đói El Niño rồi tự phục hồi khi thức ăn dồi dào.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Phản xạ chậm chạp ngoài nước lạnh và khả năng chống chịu động vật ngoại lai săn mồi như chó mèo hoang rất kém.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hormone corticosterone kích hoạt tế bào hủy xương tự tiêu giảm kích thước trong nạn đói.");
      
      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.ygcen.2005.10.012",
        label: "General and Comparative Endocrinology - Corticosterone and bone resorption in Galapagos Marine Iguanas"
      });

    } else if (c.id === 'markhor') {
      newC.diet_type = 'herbivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cỏ khô");
      addUniqueItem(newC.diet_items, "lá sồi");
      addUniqueItem(newC.diet_items, "vỏ cây");
      addUniqueItem(newC.diet_items, "cành non");
      addUniqueItem(newC.diet_items, "thảo mộc núi cao");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 13;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Mùa giao phối diễn ra vào mùa đông. Chu kỳ mang thai khoảng 135-170 ngày, con cái sinh từ 1 đến 2 con non vào mùa xuân. Con non có thể đứng vững và leo trèo cùng mẹ chỉ vài giờ sau sinh.";
      newC.locomotion = 'walk';
      newC.speed_max = 40.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 1300.0;
      newC.size_max_mm = 1860.0;
      newC.weight_avg_g = 75000.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu các khớp cổ chân linh hoạt xoay góc cực rộng giúp thích ứng cơ học tuyệt hảo khi bám các gờ đá siêu nhỏ.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Đồng tử nằm ngang cung cấp tầm nhìn toàn cảnh 320 độ không có điểm mù xung quanh để phát hiện kẻ thù.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sức lực của con đực giảm sút nghiêm trọng sau các trận chiến húc sừng tranh giành quyền giao phối kéo dài hàng tuần.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Sừng của chúng có vòng sinh trưởng hàng năm có thể dùng để tính tuổi chính xác như vòng gỗ cây.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1007/s10344-019-1302-3",
        label: "European Journal of Wildlife Research - Mountain ungulates habitat modeling"
      });

    } else if (c.id === 'mata-mata-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cá nhỏ");
      addUniqueItem(newC.diet_items, "nòng nọc");
      addUniqueItem(newC.diet_items, "côn trùng nước");
      addUniqueItem(newC.diet_items, "giáp xác nhỏ");

      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Con cái lên cạn đào tổ đẻ từ 12 đến 28 quả trứng có vỏ cứng gần các mép rừng ngập nước. Thời gian ấp trứng kéo dài khoảng 200 ngày tùy thuộc vào nhiệt độ môi trường.";
      newC.locomotion = 'crawl';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 15000.0;

      newC.characteristics = appendText(c.characteristics, "Mũi rùa Mata Mata kéo dài thành một ống thở nhỏ dài hoạt động như ống thở lặn chuyên dụng giúp lấy không khí mà không làm rung động mặt nước.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nhịn thở lâu dưới nước sâu nhờ cơ chế chuyển hóa năng lượng kỵ khí tạm thời giảm tối đa nhu cầu oxy tế bào.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sự cồng kềnh của bộ mai và chân yếu khiến rùa hoàn toàn bất lực và dễ chết khô nếu bị kẹt lật ngửa trên cạn.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Rùa Mata Mata con có màu hồng nhạt hoặc đỏ rực rỡ ở rìa mai và dưới bụng để ngụy trang giống những chiếc lá rụng mùa thu.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cbd.2021.100862",
        label: "Comparative Biochemistry and Physiology - Anaerobic metabolism in freshwater turtles"
      });

    } else if (c.id === 'mimic-octopus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cua nhỏ");
      addUniqueItem(newC.diet_items, "tôm sông");
      addUniqueItem(newC.diet_items, "cá bống bơi bám");
      addUniqueItem(newC.diet_items, "giun nhiều tơ");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Con đực truyền bao tinh dịch vào con cái bằng một cánh tay xúc tu biến đổi gọi là hectocotylus. Con cái đẻ các chuỗi trứng bám ở kẽ đá hoặc hang, sau đó nhịn ăn canh giữ tổ và chết ngay sau khi trứng nở.";
      newC.locomotion = 'swim';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 400.0;

      newC.characteristics = appendText(c.characteristics, "Có mạng lưới dây thần kinh vận động ngoại biên cực mạnh phân bố dọc các cánh tay xúc tu giúp kiểm soát cơ học không cần não bộ trung ương chỉ đạo trực tiếp.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Bộ não tiến hóa cao bậc nhất lớp chân đầu với khả năng nhận thức và chọn lựa đối tượng bắt chước phù hợp với kẻ thù đối diện.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuổi thọ cực kỳ ngắn ngủi (chỉ 1-2 năm) và cái chết không thể tránh khỏi của con cái ngay sau chu kỳ chăm sóc trứng.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khi bắt chước cá bơn, chúng ép chặt tất cả các cánh tay lại thành hình giọt nước và lướt sát đáy biển bằng phản lực nước.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1096-3642.2010.00624.x",
        label: "Zoological Journal of the Linnean Society - Mimicry and crypsis in Thaumoctopus mimicus"
      });

    } else if (c.id === 'mudskipper') {
      newC.diet_type = 'omnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "côn trùng nhỏ");
      addUniqueItem(newC.diet_items, "cua còng cộc");
      addUniqueItem(newC.diet_items, "giun đất");
      addUniqueItem(newC.diet_items, "tảo biển");
      addUniqueItem(newC.diet_items, "mùn bã hữu cơ");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Con đực đào hang sâu dạng chữ Y hoặc U trong bùn đầm lầy. Sau khi giao phối, trứng được đính trên vách hang ngập nước. Cá bố mẹ ngậm các bong bóng khí từ mặt nước mang xuống đổ đầy túi khí trong hang để cung cấp oxy cho trứng phát triển.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 270.0;
      newC.weight_avg_g = 250.0;

      newC.characteristics = appendText(c.characteristics, "Cơ ngực dày tích tụ myoglobin mức độ cao giúp hoạt động bền bỉ, hạn chế kiệt sức ngoài không khí cạn.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Vây bụng biến đổi tạo thành giác hút phễu thủy lực bám chặt vào thân cây ngập mặn dựng đứng.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Da mỏng nhầy rất mẫn cảm với biến đổi môi trường, dễ ngạt nếu bị dầu tràn phủ kín lớp da ẩm.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng là loài cá duy nhất chớp mắt bằng cách thụt mắt lồi xuống túi nước dưới hốc mắt để làm ẩm giác mạc.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.02766",
        label: "Journal of Experimental Biology - Aerial respiration and myoglobin in mudskippers"
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
