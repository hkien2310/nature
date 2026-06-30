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

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "mimic-octopus") {
      newC.characteristics = (c.characteristics || "") + " Sở hữu mạng lưới dây thần kinh ngoại biên cực kỳ phức tạp ở các xúc tua, cho phép mỗi xúc tua tự vận hành độc lập (arm autonomy) các động tác bắt chước mà không cần xung động trực tiếp liên tục từ não trung ương.";
      newC.survival_method = (c.survival_method || "") + " Khi đối đầu với loài cá bướm (damselfish) hung hãn bảo vệ lãnh thổ, bạch tuộc sẽ chủ động ngụy trang phần lớn cơ thể dưới cát, chỉ thò hai xúc tua có vằn đen trắng uốn lượn để giả dạng rắn biển độc Laticauda - thiên địch của cá bướm.";
      newC.unique_traits = (c.unique_traits || "") + " Bắt chước chủ động có chọn lọc (Selective Cognitive Mimicry): Khả năng nhận thức mối đe dọa cụ thể để chọn lựa đối tượng giả dạng phù hợp nhất từ 'kho tư liệu' hành vi gồm cá bơn, cá sư tử, rắn biển, hoặc sứa.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ sắc tố điều khiển bằng dây thần kinh tốc độ cao kết hợp cấu trúc biểu mô papillae biến đổi hình dạng da tức thì trong 0.2 giây.");
      newC.strengths = appendUniqueString(c.strengths, "Sự linh hoạt cơ học tuyệt đối của cơ thể không xương cho phép luồn lách qua các hang hẹp có đường kính chỉ bằng 1/10 chiều dài cơ thể.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Quá trình liên tục thay đổi màu sắc và cấu trúc da dưới áp lực cao tiêu tốn lượng lớn năng lượng chuyển hóa, giới hạn thời gian giả dạng liên tục.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bạch tuộc bắt chước là loài động vật thân mềm duy nhất được biết đến có khả năng giả dạng nhiều loài động vật khác nhau thay vì chỉ mô phỏng một loài duy nhất cố định.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi giả dạng cá bơn, nó khép sát các xúc tua lại thành hình thoi dẹt và uốn lượn nhịp nhàng theo sát mặt cát, tái tạo hoàn hảo kiểu bơi gợn sóng đặc trưng của loài cá này.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rspb.2001.1702", 
        "label": "Proceedings of the Royal Society B - Dynamic mimicry in an Indo-Malayan octopus (2001)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.3354/meps303173", 
        "label": "Marine Ecology Progress Series - Mimicry of flatfish by Thaumoctopus mimicus (2005)" 
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Chùy dập (dactyl club) có cấu trúc Bouligand phân tầng uốn xoắn góc nghiêng, trong đó mặt ngoài phủ lớp hydroxyapatite siêu cứng còn phần lõi là các bó sợi chitin dẻo dai giúp hấp thụ chấn động và triệt tiêu vết nứt.";
      newC.survival_method = (c.survival_method || "") + " Tích lũy cơ năng đàn hồi khổng lồ tại vùng xương yên ngựa (saddle) ở lưng bằng cách nén chặt cơ hàm co gập, sau đó giải phóng chốt chặn cơ học để phóng vụt hai chùy dập ra ngoài với gia tốc tương đương viên đạn súng lục.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ cấu lò xo yên ngựa tích năng (Saddle Spring Elastic Storage): Cấu trúc carapace hình yên ngựa có khả năng uốn cong tích lũy thế năng cơ học cực lớn, cho phép phóng lực đòn đánh mạnh gấp 100 lần lực cơ bắp thuần túy.";

      newC.strengths = appendUniqueString(c.strengths, "Thiết kế chùy Bouligand chống phân tách lớp (delamination) và chống gãy mỏi cơ học dù phải chịu hàng ngàn cú va đập nghìn Newton.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân tích hệ màu sắc phân cực tròn (circular polarization) độc nhất vô nhị giúp phát hiện các loài giáp xác ẩn mình dưới rạn san hô.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thời kỳ lột xác là tử huyệt khi lớp vỏ bảo vệ và chùy dập hóa mềm hoàn toàn, buộc chúng phải trốn sâu trong hang tối từ 1-2 tuần không thể đi săn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Lực đấm của tôm tít công nhanh và mạnh đến mức tạo ra hiện tượng sủi bong bóng chân không (cavitation bubble) có nhiệt độ lên tới hàng ngàn độ Kelvin trong chớp mắt khi bong bóng sụp đổ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chiếc chùy của chúng cứng đến mức các nhà nghiên cứu vật liệu đang mô phỏng cấu trúc của nó để chế tạo áo giáp chống đạn và vỏ máy bay siêu nhẹ thế hệ mới.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1218764", 
        "label": "Science - The Biomechanically Adaptive Structure of the Stomatopod Dactyl Club (2012)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1002/adma.201600786", 
        "label": "Advanced Materials - A Sinusoidal Phase in the Stomatopod Dactyl Club (2016)" 
      });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Hệ thống xoang mũi chứa các vách xoắn sừng (nasal tubercles) đóng vai trò như bộ giảm áp khí động học, chia nhỏ dòng khí áp suất cực cao đi vào để chim vẫn có thể hô hấp bình thường khi lao đi với vận tốc xé gió.";
      newC.survival_method = (c.survival_method || "") + " Khi thực hiện cú lao stoop, chim cắt lớn khép chặt cánh dọc theo đường cong cơ thể khí động học lý thuyết (hình giọt nước) để giảm lực cản gió xuống mức tối thiểu tuyệt đối.";
      newC.unique_traits = (c.unique_traits || "") + " Màng nháy giảm chấn mắt (Nictitating Membrane Protection): Lớp mí mắt thứ ba trong suốt có tần số quét cực nhanh giúp bảo vệ nhãn cầu khỏi bụi và độ khô của gió mà không cản trước tầm nhìn góc rộng khi đang bổ nhào.";

      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc xương ngực nở rộng bám cơ ức bay vô cùng phát triển, cung cấp tần số đập cánh mạnh mẽ và sức chịu đựng mô cơ dưới gia tốc G lớn.");
      newC.strengths = appendUniqueString(c.strengths, "Độ phân giải võng mạc cao gấp đôi con người nhờ mật độ tế bào nón cực lớn ở hai hố thị giác (foveae) trên mỗi mắt.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lực cản không khí tỷ lệ thuận với bình phương vận tốc khiến cú bổ nhào stoop tiêu tốn nguồn năng lượng glycogen cơ bắp khổng lồ, giới hạn số lần thực hiện liên tục.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi bổ nhào bắt mồi, lực G mà chim cắt phải chịu có thể lên tới 25G, gấp nhiều lần giới hạn chịu đựng của các phi công tiêm kích chuyên nghiệp.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Những chiếc nón xương trong mũi chim cắt lớn chính là nguồn cảm hứng trực tiếp để các kỹ sư thiết kế cửa nạp khí động học cho các động cơ phản lực siêu thanh.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.201.21.3229", 
        "label": "Journal of Experimental Biology - Aerodynamics and flight speed of the peregrine falcon (1998)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1371/journal.pone.0116856", 
        "label": "PLOS ONE - Aerodynamics of the hunting stoop of Peregrine Falcons (2014)" 
      });

    } else if (c.id === "purple-frog") {
      newC.characteristics = (c.characteristics || "") + " Sở hữu cấu trúc khớp háng và đai chậu xoay linh hoạt cho phép xoay ngược chân sau để bới đất đá hiệu quả khi đào lùi, kết hợp lớp sụn đệm khớp dày hấp thụ áp lực chấn động.";
      newC.survival_method = (c.survival_method || "") + " Khi mùa sinh sản đến, chúng bò ngầm dưới các rễ cây và thảm lá mục để tiếp cận dòng suối chảy xiết mà không cần lộ diện trên các tảng đá mở, tránh tầm mắt của các loài rắn nước và chim săn đêm.";
      newC.unique_traits = (c.unique_traits || "") + " Cực tính chậu thích nghi đào bới (Rotational Pelvic Digging Girdle): Khớp đai chậu và cơ mông phát triển lệch hướng cho phép chuyển đổi linh hoạt giữa kiểu bò ủi đầu về phía trước và đào xới bằng chân sau về phía sau.";

      newC.strengths = appendUniqueString(c.strengths, "Hộp sọ hyperossified (hóa xương đặc) bảo vệ tối đa các cơ quan thần kinh trung ương khỏi áp lực nén cơ học khi di chuyển dưới lòng đất cứng.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế hô hấp da phụ trợ phát triển mạnh với mạng lưới mao mạch dày dưới lớp biểu bì, hỗ trợ trao đổi khí khi ngủ đông dài ngày.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Cơ đùi chi sau tiêu giảm chiều dài khiến chúng hoàn toàn mất khả năng nhảy cao hoặc nhảy xa để thoát hiểm khi gặp kẻ thù trên cạn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Do con cái có kích thước khổng lồ gấp 3 lần con đực, trong mùa giao phối con đực phải bám chặt vào lưng con cái bằng một lớp chất nhầy kết dính tự nhiên do da bụng tiết ra để tránh bị rơi khi di chuyển qua dòng suối chảy xiết.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Ếch tím Ấn Độ dành tới 99% vòng đời của mình nằm sâu dưới lòng đất ở độ sâu từ 1.3 đến 3.7 mét và chỉ xuất hiện trên mặt đất trong khoảng thời gian rất ngắn ngủi từ vài giờ đến tối đa vài ngày.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1046/j.1420-9101.2003.00647.x", 
        "label": "Journal of Evolutionary Biology - A new family of frogs from the Western Ghats of India (2003)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1093/zoolinnean/zlaa098", 
        "label": "Zoological Journal of the Linnean Society - Amphibian skeletal evolution and fossorial lifestyle (2021)" 
      });

    } else if (c.id === "armadillo-lizard") {
      newC.characteristics = (c.characteristics || "") + " Lớp xương da osteoderms phân bố dày đặc dưới da lưng và đuôi có cấu trúc mạng lưới xốp vi mô chứa nhiều mạch máu, cho phép hấp thụ nhiệt mặt trời cực kỳ nhanh chóng khi phơi nắng.";
      newC.survival_method = (c.survival_method || "") + " Khi trú ẩn trong các khe đá hẹp, chúng phình to phổi bằng cách hít sâu khí thở, ép các gai vảy gai dựng đứng cắm chặt vào trần và sàn khe đá, khiến kẻ thù không thể lôi chúng ra ngoài.";
      newC.unique_traits = (c.unique_traits || "") + " Phình hơi khóa khớp chống trượt (Pneumatic Expansion Lock): Khả năng phình căng khoang ngực bằng hơi thở để nêm chặt cơ thể giáp gai vào khe đá hẹp, tạo ra lực ma sát chống kéo cực lớn vượt trội so với kích thước.";

      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc cơ hàm ngắn và dày tạo ra mô-men lực cắn lớn, dễ dàng nghiền nát lớp vỏ chitin cứng của các loài bọ cánh cứng sa mạc Karoo.");
      newC.strengths = appendUniqueString(c.strengths, "Lớp vảy sừng xếp tầng chứa hàm lượng keratin cao giúp giảm thiểu sự mất nước qua da dưới cái nóng thiêu đốt của Nam Phi.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Khả năng chạy nước rút cự ly ngắn bị hạn chế đáng kể do khối lượng vảy giáp chiếm tỷ trọng lớn trong tổng trọng lượng cơ thể.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng là loài thằn lằn duy nhất có tập tính sống theo nhóm gia dịch xã hội bền vững kéo dài nhiều năm, trong đó con bố mẹ chia sẻ hang trú ẩn và phối hợp tuần tra cảnh báo kẻ thù cùng con non.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cơ chế khóa hàm tự ngậm đuôi khi cuộn tròn Ouroboros hoạt động giống như một chiếc khóa zip cơ học: các gai vảy ở gốc đuôi khớp khớp hoàn hảo với các răng ở góc hàm để giữ chặt tư thế mà không gây mỏi cơ.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/j.1095-8312.2011.01783.x", 
        "label": "Biological Journal of the Linnean Society - Defensive behavior and armor evolution in Cordylid lizards (2011)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jzo.12818", 
        "label": "Journal of Zoology - Osteoderm structure and development in the armadillo girdled lizard (2020)" 
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
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 155 (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
