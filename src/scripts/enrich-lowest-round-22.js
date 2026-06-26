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
  console.log(`Selected targets for Round 22: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'assassin-bug') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "mối", "nhện nhỏ", "côn trùng nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng. Con cái đẻ trứng nhỏ rời rạc vào đất cát hoặc kẽ nứt đá, trứng nở thành ấu trùng (nymph) sau 2-3 tuần. Ấu trùng lập tức bắt đầu đi săn kiến để cõng xác lên lưng bảo vệ.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 10.0;
      newC.size_max_mm = 15.0;
      newC.weight_avg_g = 0.08;

      const charAdd = "Đầu nhỏ trang bị vòi hút (rostrum) 3 phân khúc cực cứng và nhọn. Cơ chân trước phát triển bám dính khỏe để giữ chặt con mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ấu trùng cõng xác kiến rỗng trên lưng để phá vỡ hình dáng nhận diện (disruptive camouflage) đánh lừa thị giác nhện nhảy Salticidae.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tiết chất dính tự nhiên từ các lông biểu bì để dính xác kiến lại với nhau tạo chiếc ba lô ngụy trang bảo vệ chống mất nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.anbehav.2006.01.009",
        "label": "Animal Behaviour - Corpse-carrying decoy effect in Acanthaspis petax"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chất keo dính xác kiến trên lưng không bị tan trong nước, giúp ba lô tồn tại bền bỉ qua các trận mưa lớn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Nước bọt chứa độc tố làm tê liệt thần kinh và protease hóa lỏng mô con mồi cực nhanh."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Khi mất ba lô xác kiến, ấu trùng trở nên rất mỏng manh và dễ bị nhện nhảy tiêu diệt."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'assassin-caterpillar') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["lá cây sồi", "lá cây ăn quả", "lá ngón Nam Mỹ", "lá cây Ficus"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng. Bướm đêm cái đẻ trứng thành cụm trên lá và thân cây chủ. Trứng nở thành sâu róm sau 2-3 tuần, sâu sinh hoạt bầy đàn thành các mảng lớn trên thân cây.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 45.0;
      newC.size_max_mm = 55.0;
      newC.weight_avg_g = 3.5;

      const charAdd = "Gai rỗng (scoli) phân nhánh hình cây thông chứa độc tố kết nối trực tiếp với tuyến độc ở chân bì.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sống tập trung thành cụm hàng trăm con trên thân cây để cộng hưởng khả năng ngụy trang và bảo vệ bằng gai độc.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc chứa enzyme protease Lonomin V phá hủy yếu tố đông máu prothrombin và nhân tố X.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2010.02.012",
        "label": "Toxicon - Clinical and therapeutic aspects of Lonomia obliqua envenoming"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nhộng của sâu róm nằm sâu dưới lớp lá mục hoàn toàn không chứa độc tố sau khi lột da rụng gai."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Nọc độc kháng đông máu cực mạnh có thể gây tử vong cho động vật lớn khi tiếp xúc cơ học vô ý."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Di chuyển rất chậm chạp và nhạy cảm với sự khô hạn của môi trường rừng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'atolla-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["động vật phù du", "giáp xác nhỏ", "mực con", "cá nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Thụ tinh trong/ngoài tùy loài. Trứng nở thành ấu trùng planula tự do bơi lội, sau đó phát triển thành dạng polyp bám đáy biển trước khi giải phóng sứa con ephyra.";
      newC.locomotion = 'swim';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 100.0;

      const charAdd = "Màu chuông sứa đỏ thẫm hấp thụ hoàn toàn ánh sáng xanh dung để tàng hình trong bóng tối đại dương.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Kích thái hiệu ứng báo động chống trộm phát quang xoay tròn màu xanh lam để dụ các loài săn mồi đỉnh cao tiêu diệt đối phương.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống protein xúc tác phát quang sinh học dựa trên luciferin coelenterazine siêu nhạy cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.285.5428.718",
        "label": "Science - Bioluminescent Burglar Alarms in the Deep Sea"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khi bị đứt xúc tu, xúc tu bị đứt vẫn tiếp tục chớp sáng độc lập trong vài giây để đánh lạc hướng kẻ địch."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng phát sáng định hướng truyền xa tới hơn 100 mét trong làn nước biển sâu tối tăm."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không có cơ quan giác quan phức tạp và chết ngay khi đưa lên tầng nước nông hoặc mặt nước."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'australian-box-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["tôm sú", "cá nhỏ", "cua nhỏ", "giáp xác ven bờ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Vào mùa xuân, sứa trưởng thành di cư vào các cửa sông để phóng tinh trùng và trứng. Sau khi thụ tinh, ấu trùng planula bám vào giá thể cứng, phát triển thành polyp nhỏ và lột xác giải phóng sứa con vào mùa hè.";
      newC.locomotion = 'swim';
      newC.speed_max = 7.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 2000.0;

      const charAdd = "Thân chuông trong suốt màu xanh nhạt gần như vô hình, cấu tạo từ mesoglea siêu đàn hồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Di chuyển xuống tầng nước sâu ven bờ vào ban đêm để tránh sóng gió bề mặt phá hủy cấu trúc thân sứa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu 24 con mắt nằm trong 4 cụm rhopalia, trong đó có 4 mắt có cấu tạo ống kính và võng mạc giống hệt mắt động vật có xương sống.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins11020121",
        "label": "Toxins - Chironex fleckeri Venom Extraction and Pathophysiology"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sứa hộp Úc có thể co rút 30% kích thước cơ thể khi bị đói dài ngày để tiết kiệm năng lượng trao đổi chất."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Nọc độc CfTX chọc thủng màng tế bào gây rò rỉ ion kali ồ ạt dẫn đến ngừng tim co thắt tức thì."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tuyệt đối mỏng manh trước rùa da (rùa luýt) do gai độc không thể đâm xuyên qua lớp vảy sừng hóa dày."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'australian-bulldog-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ong mật", "nhện", "ruồi", "sâu róm", "côn trùng nhỏ", "mật hoa"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng. Kiến chúa thực hiện chuyến bay sinh sản giao phối với kiến đực, lập tổ sâu dưới lòng đất. Trứng phát triển thành ấu trùng, kén nhộng và nở thành kiến thợ vô tính.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.4;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 35.0;
      newC.weight_avg_g = 0.8;

      const charAdd = "Cặp hàm răng cưa thẳng khổng lồ chứa kẽm và mangan tăng độ cứng chống mài mòn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng thị giác lập thể kép siêu nhạy sáng ban đêm và nhớ bản đồ phân cực ánh sáng bầu trời để tìm đường về tổ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc chứa peptide độc lực cao myrmeciin phá hủy màng tế bào máu và giải phóng histamin ồ ạt.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2021.2384",
        "label": "Proceedings of the Royal Society B - Peptide diversity and toxicity of Myrmecia pyriformis venom"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ấu trùng của kiến Bulldog Úc tự nhai và nuốt con mồi nguyên vẹn do kiến thợ mang về thay vì được mớm thức ăn dạng dịch như các loài kiến hiện đại khác."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Thị lực xuất sắc với 3.000 ommatidia mỗi mắt cho phép định lượng khoảng cách con mồi lập thể chính xác."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Đi săn đơn độc nên dễ bị các loài kiến quân đội hoặc động vật bầy đàn áp đảo số lượng."
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
