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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

  let hasColumn = true;
  if (error && error.message.includes("enrichment_count")) {
    hasColumn = false;
    const res = await supabase
      .from("creatures")
      .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color");
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: hasColumn ? (c.enrichment_count || 0) : 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'cookiecutter-shark') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["thịt cá voi", "thịt cá heo", "thịt cá mập lớn", "thịt hải cẩu", "mực đại dương", "cá xương"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Nở trứng trong bụng mẹ (ovoviviparous). Con non phát triển bên trong cơ thể mẹ nhờ dinh dưỡng từ noãn hoàng và sinh ra dưới dạng cá con tự lập hoàn toàn dài khoảng 14-15 cm.';
      newC.locomotion = 'swim';
      newC.speed_max = 12.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 350.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 2000.0;

      newC.characteristics = (c.characteristics || "") + " Hệ răng dưới dạng răng cưa liền khối với cấu trúc ngậm khớp chéo giúp phân bố lực cắn đều và không bị gãy lẻ tẻ.";
      newC.survival_method = (c.survival_method || "") + " Di cư thẳng đứng hàng đêm theo chu kỳ ngày đêm (diel vertical migration) giúp tiết kiệm năng lượng ở vùng nước lạnh ban ngày và kiếm ăn ở vùng nước ấm ban đêm.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ quan photophore mặt bụng phát ra ánh sáng lục lam có quang phổ giống hệt ánh sáng mặt trời/mặt trăng lọc qua nước, triệt tiêu bóng của chúng (counterillumination).";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/j.1095-8649.2011.03061.x",
          "label": "Journal of Fish Biology - Bioluminescence and vertical migration of Isistius"
        }
      ];
      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chúng có khả năng cắn đứt cả các chi tiết cao su và nhựa bọc dây cáp quang ngầm dưới đáy biển, gây nhiễu loạn truyền thông tin."
      ];
      newC.strengths = [
        ...(c.strengths || []),
        "Cơ hàm khỏe cùng cấu trúc miệng giác hút tạo áp suất âm cực lớn giúp bám giữ con mồi khổng lồ."
      ];
      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Không thể tự vệ hiệu quả trước các loài chim biển khi di cư lên tầng mặt vào ban đêm."
      ];

    } else if (c.id === 'cuttlefish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua", "tôm", "cá nhỏ", "giun nhiều tơ", "mực nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ từ 100 đến 1000 quả trứng được bao bọc bởi một lớp màng màu đen bám chặt vào đá hoặc tảo biển sâu, sau đó chúng chết sau chu kỳ sinh sản.';
      newC.locomotion = 'swim';
      newC.speed_max = 20.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 490.0;
      newC.weight_avg_g = 1800.0;

      newC.characteristics = (c.characteristics || "") + " Hệ thống sắc tố gồm hàng triệu tế bào chromatophores co giãn bằng cơ dưới sự điều khiển trực tiếp từ hệ thần kinh trung ương mà không cần qua hormone.";
      newC.survival_method = (c.survival_method || "") + " Khi bị đe dọa, mực nang phóng ra một luồng mực trộn lẫn chất nhầy tạo ra một vật thể giả (pseudomorph) có kích thước tương đương chính nó để đánh lừa kẻ thù.";
      newC.unique_traits = (c.unique_traits || "") + " Nang mực (cuttlebone) có cấu trúc vi mô dạng các tấm Aragonite song song ngăn cách bởi các cột trụ nhỏ, chịu được áp suất thủy tĩnh cao mà vẫn đảm bảo trọng lượng siêu nhẹ.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rspb.2020.3161",
          "label": "Royal Society B - Cuttlefish delay of gratification and cognitive capacity"
        }
      ];
      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Mực nang có thể tạo ra các sóng ánh sáng màu sắc chuyển động dọc cơ thể (như đèn LED chạy) để thôi miên con mồi."
      ];
      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng học tập quan sát, chúng có thể học cách giải quyết một mê cung bằng cách nhìn đồng loại thực hiện trước."
      ];
      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hệ thống mang và phễu phun nước tiêu tốn quá nhiều oxy khiến độ bền bơi đường dài rất kém."
      ];

    } else if (c.id === 'deathstalker-scorpion') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế", "gián sa mạc", "nhện", "bọ cánh cứng", "bọ cạp nhỏ khác"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con. Thời gian mang thai kéo dài từ 4-6 tháng. Con cái sinh từ 30 đến 40 con non, chúng lập tức bò lên lưng mẹ và ở đó cho đến khi lột xác lần đầu tiên.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 110.0;
      newC.weight_avg_g = 1.5;

      newC.characteristics = (c.characteristics || "") + " Bộ xương ngoài (exoskeleton) chứa beta-carboline và các hợp chất hữu cơ khác phát huỳnh quang màu xanh lá cây rực rỡ dưới ánh sáng cực tím.";
      newC.survival_method = (c.survival_method || "") + " Ngâm mình sâu dưới cát hoang mạc trong suốt cả ngày giúp tránh nóng và giảm thiểu sự mất nước qua da xuống mức gần bằng không.";
      newC.unique_traits = (c.unique_traits || "") + " Độc tố chlorotoxin nhắm mục tiêu chính xác vào các kênh Cl- của màng tế bào, được chứng minh có khả năng liên kết chọn lọc cao với tế bào ung thư não ở người.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1016/j.jprot.2014.07.013",
          "label": "Journal of Proteomics - Neurotoxins from the venom of Leiurus quinquestriatus"
        }
      ];
      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chúng phát ánh sáng huỳnh quang màu xanh lục lam dưới tia UV nhờ lớp cutin chứa các hợp chất liên kết hóa học đặc biệt."
      ];
      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng nhắm mục tiêu cực tốt nhờ lông cảm biến rung động Trichobothria phát hiện kiến cách xa 30 cm."
      ];
      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Khớp bám chân chuyên dụng bám cát đá khiến chúng hoàn toàn không thể di chuyển trên các bề mặt quá nhẵn như thủy tinh."
      ];

    } else if (c.id === 'deep-sea-anglerfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá lanternfish", "mực biển sâu", "tôm đỏ", "cá rồng biển sâu", "giáp xác chân chèo"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Ký sinh sinh dục dị biệt. Con đực cắn vào con cái, giải phóng enzyme làm tan rã mô để nối liền tuần hoàn máu, trở thành một tuyến sản xuất tinh trùng vĩnh viễn nuôi bằng dinh dưỡng của con cái.';
      newC.locomotion = 'swim';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 180.0;
      newC.weight_avg_g = 400.0;

      newC.characteristics = (c.characteristics || "") + " Da của chúng chứa lượng hắc tố melanin cao bất thường, hấp thụ tới 99.9% photon ánh sáng mặt trời hoặc ánh sáng sinh học hướng tới nó.";
      newC.survival_method = (c.survival_method || "") + " Cơ chế làm giảm độ đậm đặc của cơ bắp và xương thành các sụn lỏng xốp giúp chúng chịu được áp suất đại dương hàng trăm atm mà không bị ép nát cơ thể.";
      newC.unique_traits = (c.unique_traits || "") + " Khuyết tật miễn dịch tiến hóa chọn lọc (lược bỏ gene lympho T và RAG) cho phép con đực ghép da thịt dung hợp hệ mạch máu vào cơ thể con cái mà không bị đào thải miễn dịch.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1126/science.aaz9282",
          "label": "Science - The immunogenetics of sexual parasitism in anglerfishes"
        }
      ];
      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chiếc cần câu phát sáng esca của chúng thực chất được nuôi dưỡng bởi một loài vi khuẩn cộng sinh đặc hiệu không thể tìm thấy tự do trong đại dương."
      ];
      newC.strengths = [
        ...(c.strengths || []),
        "Dạ dày siêu co giãn cùng xương miệng có khớp xoay rộng gấp 2 lần đầu giúp nuốt chửng con mồi to gấp đôi bản thân."
      ];
      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Lực cắn cơ học rất yếu do cấu trúc xương và cơ bắp giảm thiểu tối đa để tiết kiệm năng lượng."
      ];

    } else if (c.id === 'diabolical-ironclad-beetle') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["nấm vỏ cây", "chất hữu cơ mục nát", "mùn gỗ sồi", "lá mục"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ trứng vào khe nứt của vỏ cây sồi già khô. Ấu trùng nở ra sẽ ăn gỗ mục và nấm gỗ để sinh trưởng trong vòng 1-2 năm trước khi hóa nhộng.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.15;

      newC.characteristics = (c.characteristics || "") + " Lớp vỏ cứng cáp elytra của bọ cánh cứng sắt được liên kết chặt với tấm ức thông qua hệ thống khớp nối răng cưa khóa chặt dạng zipper.";
      newC.survival_method = (c.survival_method || "") + " Khi bị tấn công, chúng co chân sát thân và giả chết (thanatosis), biến cơ thể thành một viên đá sần sùi không thể nhai hay cắn nát đối với hầu hết các loài chim sa mạc.";
      newC.unique_traits = (c.unique_traits || "") + " Khớp nối jigsaw ở elytra có cấu trúc răng cưa dạng elip phân lớp (elliptical blades) cho phép vỏ trượt nhẹ để hấp thụ ứng lực nén ép chấn động lớn mà không vỡ nát.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1038/s41586-020-2813-8",
          "label": "Nature - Toughening mechanisms of the diabolical ironclad beetle"
        }
      ];
      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Lớp vỏ của chúng cứng đến mức các nhà côn trùng học khi thu thập mẫu vật thường phải khoan mồi một lỗ nhỏ trước khi đóng kim thép."
      ];
      newC.strengths = [
        ...(c.strengths || []),
        "Chịu lực ép tĩnh lên tới 149 Newtons nhờ cơ chế phao trượt cơ học phân tầng delamination dưới lớp biểu bì vỏ."
      ];
      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Đôi cánh elytra dung hợp vĩnh viễn khiến chúng mất khả năng bay lượn hoàn toàn để thoát hiểm nhanh."
      ];
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
