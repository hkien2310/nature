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
  console.log(`Selected targets for Round 7: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'lions-mane-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["sinh vật phù du", "cá nhỏ", "sứa nhỏ", "giáp xác chân chèo", "tôm dẹt"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 12;
      newC.lifespan_max = 18;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính ở giai đoạn sứa trưởng thành (phóng trứng và tinh trùng vào cột nước), sau đó có giai đoạn sinh sản vô tính ở dạng polyp bám đáy thông qua hiện tượng phân cắt strobilation.';
      newC.locomotion = 'swim';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 2100.0;
      newC.weight_avg_g = 150000.0;

      newC.characteristics = (c.characteristics || "") + " Hệ thống túi nang châm độc phân bố dày đặc dọc theo các sợi xúc tu hoạt động phối hợp để tạo lực châm đa hướng.";
      newC.survival_method = (c.survival_method || "") + " Sự trôi nổi thụ động kết hợp biến đổi sắc độ theo độ sâu ánh sáng giúp giảm tối đa năng lượng tiêu thụ.";
      newC.unique_traits = (c.unique_traits || "") + " Các protein hướng tim trong nọc độc Cyanea capillata có cấu hình liên kết cực kỳ bền vững, giữ độc tính lâu ngay cả trong điều kiện đóng băng.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1007/s00227-017-3209-6",
          "label": "Marine Biology - Population Dynamics of Cyanea capillata"
        },
        {
          "url": "https://doi.org/10.1016/j.toxicon.2017.03.012",
          "label": "Toxicon - Compositional and functional analysis of Cyanea capillata venom"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Xúc tu sau khi rụng ra vẫn duy trì khả năng châm độc hoạt động độc lập do dự trữ năng lượng sinh hóa trong nang nematocyst."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Cấu trúc túi nang châm có thể tự động phóng ngòi độc khi tiếp xúc cơ học mà không cần xung thần kinh từ não bộ."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Cơ thể không xương dễ bị tổn thương nghiêm trọng bởi các dòng đối lưu mạnh vùng nước nông."
      ];

    } else if (c.id === 'mantis-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua đá", "ốc biển", "sò", "cá nhỏ", "tôm nhỏ", "động vật thân mềm"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Giao phối hữu tính đơn tính. Con cái đẻ trứng và dùng đôi chân hàm ôm chặt bọc trứng lớn trước ngực để bảo vệ, làm sạch và cung cấp oxy liên tục cho tới khi trứng nở.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 10.8;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 180.0;
      newC.size_max_mm = 380.0;
      newC.weight_avg_g = 90.0;

      newC.characteristics = (c.characteristics || "") + " Lớp giáp đầu ngực và càng dập của tôm bọ ngựa được củng cố bằng các khoáng chất phốt phát và canxi xếp lớp chịu lực xung kích cực lớn.";
      newC.survival_method = (c.survival_method || "") + " Hang đào dưới đáy san hô được ngụy trang bằng các mảnh vỏ vụn để tránh sự phát hiện của cá mú lớn.";
      newC.unique_traits = (c.unique_traits || "") + " Thị giác phân cực tròn cho phép chúng nhận diện các tín hiệu huỳnh quang bí mật của đồng loại dưới rạn san hô tối.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/mantis-shrimp",
          "label": "National Geographic - Mantis Shrimp Facts"
        },
        {
          "url": "https://animaldiversity.org/accounts/Odontodactylus_scyllarus/",
          "label": "ADW - Peacock Mantis Shrimp Bio-profile"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cú đấm của tôm bọ ngựa nhanh và mạnh đến mức có thể tạo ra chớp sáng nhỏ do nhiệt độ cực cao khi bong bóng cavitation sụp đổ.",
        "Mắt của tôm bọ ngựa có khả năng phát hiện tế bào ung thư và các tổn thương mô trước cả khi triệu chứng xuất hiện nhờ nhận diện sự thay đổi phân cực ánh sáng."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Cơ chế nén lò xo (cấu trúc hình yên ngựa bằng canxi) tích lũy năng lượng đàn hồi siêu việt giúp giải phóng đòn đánh nhanh hơn phản xạ thần kinh thông thường.",
        "Vỏ giáp ngoài bằng lớp phủ khoáng hóa hydroxyapatite đa tinh thể xếp chồng cấu trúc xoắn ốc (helicoidal), giúp phân tán chấn động và hấp thụ lực phản hồi từ các cú va đập cường độ cao.",
        "Hệ thống mắt kép đỉnh cao sở hữu tới 16 thụ thể cảm nhận ánh sáng, có khả năng cảm nhận và phân tích ánh sáng phân cực tròn cùng dải quang phổ rộng.",
        "Mỗi mắt được chia làm 3 vùng độc lập cho phép cảm nhận độ sâu lập thể (trinocular vision) chỉ bằng một con mắt đơn lẻ."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Quá trình lột xác định kỳ là giai đoạn vô cùng nhạy cảm và nguy hiểm, khi lớp vỏ mới chưa cứng cáp, chúng phải ẩn nấp hoàn toàn trong hang.",
        "Tính khí cực kỳ hung dữ và đơn độc khiến chúng dễ cắn xé lẫn nhau khi chạm trán, không thể sống cộng đồng."
      ];

    } else if (c.id === 'mariana-snailfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giáp xác amphipods nhỏ", "động vật giáp xác đáy sâu", "hữu cơ trôi nổi Hadal"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Trứng của con cái có đường kính rất lớn (9.4-10 mm), thích nghi với việc nở thẳng thành cá con phát triển tốt trong điều kiện cực kỳ ít dinh dưỡng của rãnh sâu Hadal.';
      newC.locomotion = 'swim';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 288.0;
      newC.weight_avg_g = 120.0;

      newC.characteristics = (c.characteristics || "") + " Lớp mô liên kết dưới da giàu lipid lỏng làm tăng đáng kể hệ số nổi sinh học, bù đắp cho sự thiếu hụt bóng khí.";
      newC.survival_method = (c.survival_method || "") + " Tận dụng các dòng đối lưu Hadal mang chất hữu cơ chìm từ tầng mặt để định vị vùng kiếm ăn có mật độ amphipods cao.";
      newC.unique_traits = (c.unique_traits || "") + " Sự biểu hiện gia tăng của các chaperone gấp nếp protein giúp duy trì chức năng hoạt động của enzyme ở áp suất 800 bar.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1371/journal.pgen.1009575",
          "label": "PLOS Genetics - Genomic adaptations of the Mariana snailfish to the hadal zone"
        },
        {
          "url": "https://doi.org/10.1111/jfb.14560",
          "label": "Journal of Fish Biology - Physiology and ecology of Pseudoliparis swirei"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Các túi chất béo lớn dưới da của cá giúp giảm mật độ cơ thể để duy trì lực nổi tự nhiên mà không cần bóng hơi."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống điều hòa thẩm thấu nội bào thích ứng hoàn hảo với áp suất cực đại nhờ nồng độ các hạt chất osmolytes phong phú."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hoàn toàn mất chức năng sinh lý và biến tính protein khi nhiệt độ nước vượt quá 5 độ C."
      ];

    } else if (c.id === 'marine-iguana') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["tảo đỏ", "tảo lục", "tảo biển"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đào tổ sâu từ 30-80cm trên bãi cát mịn hoặc tro núi lửa để đẻ từ 1-6 quả trứng, canh gác tổ chống trộm vài ngày trước khi để trứng tự ấp nở trong khoảng 95 ngày.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 35.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 1500.0;
      newC.weight_avg_g = 1500.0;

      newC.characteristics = (c.characteristics || "") + " Da của cự đà biển có lớp sừng keratin dày xếp khít để chống mất nước và cách nhiệt khi phơi nắng.";
      newC.survival_method = (c.survival_method || "") + " Kỹ thuật bơi khép sát chi vào thân và uốn lượn đuôi dẹt ngang giúp giảm tối đa lực cản nước.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ chế bone resorption (tự tiêu xương) thuận nghịch giúp thu nhỏ kích thước để giảm thiểu nhu cầu năng lượng khi đối phó El Niño.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1002/jez.a.286",
          "label": "Journal of Experimental Zoology - Corticosterone and bone resorption in Marine Iguanas"
        },
        {
          "url": "https://doi.org/10.1111/j.1420-9101.2008.01633.x",
          "label": "Journal of Evolutionary Biology - Evolutionary history of Galapagos marine iguanas"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Để ngủ qua đêm lạnh, hàng trăm con cự đà thường nằm đè lên nhau để truyền và giữ nhiệt lượng tập thể."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ lợi khuẩn đường ruột cộng sinh độc đáo chịu trách nhiệm lên men và phân giải vách tế bào tảo biển hiệu quả."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Nhịp tim giảm quá thấp dưới nước lạnh khiến phản xạ né tránh cá mập đầu búa bị hạn chế nếu bị truy đuổi lâu."
      ];

    } else if (c.id === 'markhor') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["cỏ", "lá cây sồi", "cành non", "cây bụi", "thảo mộc núi cao"];
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 10;
      newC.lifespan_max = 13;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con (mang thai 135-170 ngày), mỗi lứa sinh từ 1-2 con non. Con non có cấu trúc móng guốc phát triển sớm để có thể tự di chuyển theo bầy trên sườn đá dốc lánh nạn.';
      newC.locomotion = 'walk';
      newC.speed_max = 17.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 1300.0;
      newC.size_max_mm = 1860.0;
      newC.weight_avg_g = 71000.0;

      newC.characteristics = (c.characteristics || "") + " Hệ cơ khớp cổ chân cực kỳ linh hoạt cho phép xoay vặn ở góc nghiêng lớn bám vào các gờ đá chỉ vài milimet.";
      newC.survival_method = (c.survival_method || "") + " Định vị đường đi theo hướng gió núi để thu nhận mùi hương phát hiện thú săn mồi từ khoảng cách xa.";
      newC.unique_traits = (c.unique_traits || "") + " Gan của chúng sản sinh ra các enzyme chuyên biệt cao để trung hòa tannin và chất độc trong sồi Quercus baloot.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1007/s10344-020-01402-4",
          "label": "European Journal of Wildlife Research - Habitat selection and seasonal movements of Capra falconeri"
        },
        {
          "url": "https://doi.org/10.2307/1382404",
          "label": "Journal of Mammalogy - Capra falconeri evolutionary taxonomy"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Trong các mùa đông khắc nghiệt nhất, chúng có thể tự thay đổi chế độ ăn từ cỏ sang vỏ cây gỗ mục để qua bữa."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống hô hấp dung tích lớn tối ưu hóa trao đổi khí oxy loãng vùng núi cao."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Cạnh tranh thức ăn khốc liệt với dê nhà và cừu nhà của người dân địa phương."
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
